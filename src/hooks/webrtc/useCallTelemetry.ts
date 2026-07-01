/**
 * useCallTelemetry - WebRTC health monitoring and metrics collection
 * Emits call metrics via console (dev) and optional callback
 */
import { useRef, useCallback, useEffect } from 'react';
import { CallMetrics } from './types';
import { logger } from '@/lib/logger';

export interface UseCallTelemetryOptions {
  callId: string | null;
  peerConnections: React.MutableRefObject<Map<string, RTCPeerConnection>>;
  onCallMetrics?: (metrics: CallMetrics) => void;
  enabled?: boolean;
}

export interface UseCallTelemetryReturn {
  /** Current metrics for the call */
  currentMetrics: React.MutableRefObject<CallMetrics | null>;
  /** Reconnect attempt counter */
  reconnectAttempts: React.MutableRefObject<number>;
  /** Call start time */
  callStartTime: React.MutableRefObject<number | null>;
  /** Call end reason */
  callEndReason: React.MutableRefObject<string | null>;
  /** Update metrics from peer connection */
  collectMetrics: (pc: RTCPeerConnection, peerId: string) => Promise<CallMetrics | null>;
  /** Increment reconnect attempts */
  incrementReconnectAttempts: () => void;
  /** Set call end reason */
  setCallEndReason: (reason: string) => void;
  /** Log final metrics on call end */
  logFinalMetrics: () => void;
}

export function useCallTelemetry(options: UseCallTelemetryOptions): UseCallTelemetryReturn {
  const { callId, peerConnections, onCallMetrics, enabled = true } = options;
  
  const currentMetrics = useRef<CallMetrics | null>(null);
  const reconnectAttempts = useRef(0);
  const callStartTime = useRef<number | null>(null);
  const callEndReason = useRef<string | null>(null);
  const lastBytesReceived = useRef<Map<string, { audio: number; video: number }>>(new Map());
  const lastTimestamp = useRef<Map<string, number>>(new Map());

  /**
   * Collect metrics from a peer connection
   */
  const collectMetrics = useCallback(async (
    pc: RTCPeerConnection,
    peerId: string
  ): Promise<CallMetrics | null> => {
    if (!callId || !enabled) return null;

    try {
      const stats = await pc.getStats();
      
      let selectedPair: CallMetrics['selectedCandidatePair'] = null;
      let audioBitrate = 0;
      let videoBitrate = 0;
      let audioPacketLoss = 0;
      let videoPacketLoss = 0;
      let audioPacketsReceived = 0;
      let audioPacketsLost = 0;
      let videoPacketsReceived = 0;
      let videoPacketsLost = 0;
      
      const now = Date.now();
      const lastBytes = lastBytesReceived.current.get(peerId) || { audio: 0, video: 0 };
      const lastTs = lastTimestamp.current.get(peerId) || now;
      const elapsed = (now - lastTs) / 1000; // seconds

      stats.forEach(report => {
        // Selected candidate pair
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localCandidate = stats.get(report.localCandidateId);
          const remoteCandidate = stats.get(report.remoteCandidateId);
          
          selectedPair = {
            localType: localCandidate?.candidateType || null,
            remoteType: remoteCandidate?.candidateType || null,
            localProtocol: localCandidate?.protocol || null,
            remoteProtocol: remoteCandidate?.protocol || null,
          };
        }

        // Inbound audio stats
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          const bytesReceived = report.bytesReceived || 0;
          if (elapsed > 0 && lastBytes.audio > 0) {
            audioBitrate = Math.round((bytesReceived - lastBytes.audio) * 8 / elapsed); // bps
          }
          lastBytes.audio = bytesReceived;
          audioPacketsReceived = report.packetsReceived || 0;
          audioPacketsLost = report.packetsLost || 0;
        }

        // Inbound video stats
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          const bytesReceived = report.bytesReceived || 0;
          if (elapsed > 0 && lastBytes.video > 0) {
            videoBitrate = Math.round((bytesReceived - lastBytes.video) * 8 / elapsed); // bps
          }
          lastBytes.video = bytesReceived;
          videoPacketsReceived = report.packetsReceived || 0;
          videoPacketsLost = report.packetsLost || 0;
        }
      });

      // Calculate packet loss percentages
      if (audioPacketsReceived + audioPacketsLost > 0) {
        audioPacketLoss = (audioPacketsLost / (audioPacketsReceived + audioPacketsLost)) * 100;
      }
      if (videoPacketsReceived + videoPacketsLost > 0) {
        videoPacketLoss = (videoPacketsLost / (videoPacketsReceived + videoPacketsLost)) * 100;
      }

      lastBytesReceived.current.set(peerId, lastBytes);
      lastTimestamp.current.set(peerId, now);

      const callDurationMs = callStartTime.current ? now - callStartTime.current : 0;

      const metrics: CallMetrics = {
        callId,
        peerConnectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState,
        selectedCandidatePair: selectedPair,
        bitrate: {
          audio: audioBitrate,
          video: videoBitrate,
        },
        packetLoss: {
          audio: Math.round(audioPacketLoss * 100) / 100,
          video: Math.round(videoPacketLoss * 100) / 100,
        },
        reconnectAttempts: reconnectAttempts.current,
        callDurationMs,
        callEndReason: callEndReason.current,
        timestamp: now,
      };

      currentMetrics.current = metrics;

      // Log metrics in development
      if (import.meta.env.DEV) {
        logger.debug('📊 Call metrics', 'Telemetry', {
          connectionState: metrics.peerConnectionState,
          iceState: metrics.iceConnectionState,
          audioBitrate: `${Math.round(metrics.bitrate.audio / 1000)} kbps`,
          videoBitrate: `${Math.round(metrics.bitrate.video / 1000)} kbps`,
          audioPacketLoss: `${metrics.packetLoss.audio}%`,
          videoPacketLoss: `${metrics.packetLoss.video}%`,
          candidatePair: metrics.selectedCandidatePair,
          reconnects: metrics.reconnectAttempts,
          duration: `${Math.round(callDurationMs / 1000)}s`,
        });
      }

      // Emit via callback if provided
      if (onCallMetrics) {
        onCallMetrics(metrics);
      }

      return metrics;
    } catch (error) {
      logger.error('Error collecting metrics', 'Telemetry', error);
      return null;
    }
  }, [callId, enabled, onCallMetrics]);

  /**
   * Increment reconnect attempts counter
   */
  const incrementReconnectAttempts = useCallback(() => {
    reconnectAttempts.current += 1;
    logger.debug('Reconnect attempt', 'Telemetry', reconnectAttempts.current);
  }, []);

  /**
   * Set call end reason
   */
  const setCallEndReason = useCallback((reason: string) => {
    callEndReason.current = reason;
    logger.debug('Call end reason', 'Telemetry', reason);
  }, []);

  /**
   * Log final metrics when call ends
   */
  const logFinalMetrics = useCallback(() => {
    if (currentMetrics.current) {
      const metrics = currentMetrics.current;
      logger.debug('📊 Final call metrics', 'Telemetry', {
        callId: metrics.callId,
        duration: `${Math.round(metrics.callDurationMs / 1000)}s`,
        endReason: metrics.callEndReason,
        reconnectAttempts: metrics.reconnectAttempts,
        finalState: metrics.peerConnectionState,
      });

      if (onCallMetrics) {
        onCallMetrics({
          ...metrics,
          callEndReason: callEndReason.current,
          timestamp: Date.now(),
        });
      }
    }
  }, [onCallMetrics]);

  // Periodic metrics collection
  useEffect(() => {
    if (!callId || !enabled) return;

    // Mark call start time
    callStartTime.current = Date.now();
    reconnectAttempts.current = 0;
    callEndReason.current = null;

    const interval = setInterval(() => {
      peerConnections.current.forEach((pc, peerId) => {
        if (pc.connectionState === 'connected') {
          collectMetrics(pc, peerId);
        }
      });
    }, 5000); // Every 5 seconds

    return () => {
      clearInterval(interval);
      logFinalMetrics();
    };
  }, [callId, enabled, peerConnections, collectMetrics, logFinalMetrics]);

  return {
    currentMetrics,
    reconnectAttempts,
    callStartTime,
    callEndReason,
    collectMetrics,
    incrementReconnectAttempts,
    setCallEndReason,
    logFinalMetrics,
  };
}
