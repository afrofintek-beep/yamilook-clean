/**
 * useMediaCapture - Handles getUserMedia and local stream management
 * Responsible for capturing audio/video from user devices
 */
import { useState, useRef, useCallback } from 'react';
import { CallSettings } from './types';

export interface UseMediaCaptureReturn {
  localStream: MediaStream | null;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  screenStream: MediaStream | null;
  screenStreamRef: React.MutableRefObject<MediaStream | null>;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  getUserMedia: (settings: CallSettings) => Promise<MediaStream>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  flipCamera: () => Promise<void>;
  stopAllMedia: () => void;
  replaceTrackInPeerConnections: (
    newTrack: MediaStreamTrack,
    kind: 'audio' | 'video',
    peerConnections: Map<string, RTCPeerConnection>
  ) => void;
}

export function useMediaCapture(): UseMediaCaptureReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  /**
   * Get user media (camera/microphone)
   */
  const getUserMedia = useCallback(async (settings: CallSettings): Promise<MediaStream> => {
    console.log('[MediaCapture] Getting user media:', settings);

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: settings.echoCancellation,
      noiseSuppression: settings.noiseSuppression,
      autoGainControl: true,
    };

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      facingMode: 'user',
      frameRate: { ideal: 30, max: 60 },
    };

    // Helper to attempt getUserMedia and store result
    const tryGetStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      const hasVideo = stream.getVideoTracks().length > 0;
      setIsVideoEnabled(hasVideo);
      setIsMuted(!settings.audioEnabled);
      console.log('[MediaCapture] Got local stream:', stream.getTracks().map((t) => `${t.kind}:${t.enabled}`));
      return stream;
    };

    // Attempt 1: requested constraints (video + audio or audio-only)
    try {
      return await tryGetStream({
        video: settings.videoEnabled ? videoConstraints : false,
        audio: settings.audioEnabled ? audioConstraints : false,
      });
    } catch (err1) {
      console.warn('[MediaCapture] First getUserMedia attempt failed:', err1);

      // Attempt 2: if video was requested, fall back to audio-only
      if (settings.videoEnabled) {
        console.warn('[MediaCapture] Retrying with audio-only fallback...');
        try {
          return await tryGetStream({
            video: false,
            audio: settings.audioEnabled ? audioConstraints : false,
          });
        } catch (err2) {
          console.warn('[MediaCapture] Audio-only fallback also failed, trying bare audio...');
        }
      }

      // Attempt 3: bare audio (no constraints) as last resort
      try {
        return await tryGetStream({ video: false, audio: true });
      } catch (err3) {
        console.error('[MediaCapture] All getUserMedia attempts failed:', err3);
        throw err3;
      }
    }
  }, []);

  /**
   * Toggle audio mute
   */
  const toggleMute = useCallback(() => {
    console.log('[MediaCapture] toggleMute called, localStream exists:', !!localStreamRef.current);

    if (!localStreamRef.current) {
      console.warn('[MediaCapture] No local stream available for mute toggle');
      setIsMuted(prev => !prev);
      return;
    }

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const newMuted = !audioTrack.enabled;
      console.log('[MediaCapture] Toggled mute:', newMuted);
      setIsMuted(newMuted);
    } else {
      console.warn('[MediaCapture] No audio track found in local stream');
    }
  }, []);

  /**
   * Toggle video on/off
   */
  const toggleVideo = useCallback(() => {
    console.log('[MediaCapture] toggleVideo called, localStream exists:', !!localStreamRef.current);

    if (!localStreamRef.current) {
      console.warn('[MediaCapture] No local stream available for video toggle');
      setIsVideoEnabled(prev => !prev);
      return;
    }

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const newEnabled = videoTrack.enabled;
      console.log('[MediaCapture] Toggled video:', newEnabled);
      setIsVideoEnabled(newEnabled);
    } else {
      console.warn('[MediaCapture] No video track found in local stream');
    }
  }, []);

  /**
   * Toggle screen sharing
   */
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Handle stop from browser UI
        const videoTrack = stream.getVideoTracks()[0];
        videoTrack.onended = () => {
          screenStreamRef.current?.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
          setScreenStream(null);
          setIsScreenSharing(false);
        };
      } catch (error) {
        console.error('[MediaCapture] Error starting screen share:', error);
      }
    }
  }, [isScreenSharing]);

  /**
   * Flip camera (front/back on mobile)
   */
  const flipCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    const currentTrack = localStreamRef.current.getVideoTracks()[0];
    if (!currentTrack) return;

    const settings = currentTrack.getSettings();
    const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace in local stream
      localStreamRef.current.removeTrack(currentTrack);
      localStreamRef.current.addTrack(newVideoTrack);
      currentTrack.stop();

      // Trigger re-render
      setLocalStream(localStreamRef.current);
    } catch (error) {
      console.error('[MediaCapture] Error flipping camera:', error);
    }
  }, []);

  /**
   * Stop all media tracks
   */
  const stopAllMedia = useCallback(() => {
    console.log('[MediaCapture] Stopping all media');
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  /**
   * Replace a track in all peer connections
   */
  const replaceTrackInPeerConnections = useCallback((
    newTrack: MediaStreamTrack,
    kind: 'audio' | 'video',
    peerConnections: Map<string, RTCPeerConnection>
  ) => {
    peerConnections.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === kind);
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    });
  }, []);

  return {
    localStream,
    localStreamRef,
    screenStream,
    screenStreamRef,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    getUserMedia,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    flipCamera,
    stopAllMedia,
    replaceTrackInPeerConnections,
  };
}
