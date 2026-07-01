/**
 * useICECandidateQueue - Manages ICE candidate queueing and application
 * ICE candidates must be queued until remote description is set.
 * Queues are bounded to prevent memory leaks.
 */
import { useRef, useCallback } from 'react';

const MAX_QUEUE_SIZE = 200;

export interface UseICECandidateQueueReturn {
  /** Queue an incoming ICE candidate for a peer */
  queueIncomingCandidate: (peerId: string, candidate: RTCIceCandidateInit) => void;
  /** Queue an outgoing ICE candidate when callId isn't ready */
  queueOutgoingCandidate: (peerId: string, candidate: RTCIceCandidateInit) => void;
  /** Apply all pending incoming candidates for a peer */
  applyPendingCandidates: (peerId: string, pc: RTCPeerConnection) => Promise<void>;
  /** Get and clear outgoing candidates for a peer */
  flushOutgoingCandidates: (peerId: string) => RTCIceCandidateInit[];
  /** Clear all queues */
  clearAllQueues: () => void;
  /** Check if we have pending incoming candidates */
  hasPendingCandidates: (peerId: string) => boolean;
}

export function useICECandidateQueue(): UseICECandidateQueueReturn {
  const pendingIncoming = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const pendingOutgoing = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const queueIncomingCandidate = useCallback((peerId: string, candidate: RTCIceCandidateInit) => {
    const pending = pendingIncoming.current.get(peerId) || [];
    if (pending.length >= MAX_QUEUE_SIZE) {
      console.warn('[ICEQueue] Incoming queue full for:', peerId, '— dropping oldest');
      pending.shift();
    }
    pending.push(candidate);
    pendingIncoming.current.set(peerId, pending);
  }, []);

  const queueOutgoingCandidate = useCallback((peerId: string, candidate: RTCIceCandidateInit) => {
    const pending = pendingOutgoing.current.get(peerId) || [];
    if (pending.length >= MAX_QUEUE_SIZE) {
      console.warn('[ICEQueue] Outgoing queue full for:', peerId, '— dropping oldest');
      pending.shift();
    }
    pending.push(candidate);
    pendingOutgoing.current.set(peerId, pending);
  }, []);

  const applyPendingCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const pending = pendingIncoming.current.get(peerId) || [];
    if (pending.length === 0) return;

    console.log('[ICEQueue] Applying', pending.length, 'pending ICE candidates for:', peerId);

    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('[ICEQueue] Error adding queued ICE candidate:', error);
      }
    }
    pendingIncoming.current.delete(peerId);
  }, []);

  const flushOutgoingCandidates = useCallback((peerId: string): RTCIceCandidateInit[] => {
    const queued = pendingOutgoing.current.get(peerId) || [];
    if (queued.length > 0) {
      console.log('[ICEQueue] Flushing', queued.length, 'outgoing ICE candidates for:', peerId);
      pendingOutgoing.current.delete(peerId);
    }
    return queued;
  }, []);

  const clearAllQueues = useCallback(() => {
    pendingIncoming.current.clear();
    pendingOutgoing.current.clear();
  }, []);

  const hasPendingCandidates = useCallback((peerId: string): boolean => {
    const pending = pendingIncoming.current.get(peerId);
    return !!pending && pending.length > 0;
  }, []);

  return {
    queueIncomingCandidate,
    queueOutgoingCandidate,
    applyPendingCandidates,
    flushOutgoingCandidates,
    clearAllQueues,
    hasPendingCandidates,
  };
}
