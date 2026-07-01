/**
 * useAutoplayRecovery - Handles browser autoplay policy recovery
 * Browsers block autoplay until user interaction occurs
 */
import { useRef, useCallback, useEffect } from 'react';

export interface UseAutoplayRecoveryReturn {
  /** Whether user has interacted with the page */
  userInteracted: boolean;
  /** Attempt to play a remote media stream */
  tryPlayRemoteStream: (stream: MediaStream, peerId: string) => Promise<void>;
  /** Mark user interaction as having occurred */
  markUserInteracted: () => void;
}

export function useAutoplayRecovery(): UseAutoplayRecoveryReturn {
  const userInteractedRef = useRef(false);

  // Track user interaction for autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      console.log('[AutoplayRecovery] User interaction detected');
      userInteractedRef.current = true;
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  /**
   * Mark that user has interacted with the page
   */
  const markUserInteracted = useCallback(() => {
    console.log('[AutoplayRecovery] Manually marking user interaction');
    userInteractedRef.current = true;
  }, []);

  /**
   * Attempt to play remote media stream with autoplay recovery
   */
  const tryPlayRemoteStream = useCallback(async (stream: MediaStream, peerId: string) => {
    console.log('[AutoplayRecovery] Attempting to play remote stream for:', peerId);

    // Find any video/audio elements with this stream and try to play
    const videoElements = document.querySelectorAll('video');
    const audioElements = document.querySelectorAll('audio');

    const tryPlay = async (element: HTMLMediaElement) => {
      if (element.srcObject === stream && element.paused) {
        try {
          await element.play();
          console.log('[AutoplayRecovery] Successfully started playback for remote stream');
          return true;
        } catch (error) {
          console.warn('[AutoplayRecovery] Autoplay blocked, waiting for user interaction:', error);
          
          // Set up retry on user interaction
          const retryPlay = async () => {
            try {
              await element.play();
              console.log('[AutoplayRecovery] Successfully started playback after user interaction');
            } catch (e) {
              console.error('[AutoplayRecovery] Still failed to play after interaction:', e);
            }
          };
          
          document.addEventListener('click', retryPlay, { once: true });
          document.addEventListener('touchstart', retryPlay, { once: true });
          return false;
        }
      }
      return false;
    };

    // Try video elements
    for (const video of videoElements) {
      await tryPlay(video);
    }

    // Try audio elements
    for (const audio of audioElements) {
      await tryPlay(audio);
    }
  }, []);

  return {
    userInteracted: userInteractedRef.current,
    tryPlayRemoteStream,
    markUserInteracted,
  };
}
