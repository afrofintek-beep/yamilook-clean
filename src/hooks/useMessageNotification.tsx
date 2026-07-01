import { useCallback, useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { SoundName, SOUND_PLAYERS } from '@/lib/notification-sounds';

// Vibration patterns for different notification types
const VIBRATION_PATTERNS = {
  message: [100, 50, 100],
  reaction: [50],
  mention: [100, 30, 100, 30, 100],
};

// Check if Vibration API is supported
const isVibrationSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Check if current time is within quiet hours
const isInQuietHours = (
  quietHoursEnabled: boolean,
  quietHoursStart: string | null,
  quietHoursEnd: string | null
): boolean => {
  if (!quietHoursEnabled || !quietHoursStart || !quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = quietHoursStart.split(':').map(Number);
  const [endH, endM] = quietHoursEnd.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

const ALL_SOUND_NAMES: SoundName[] = ['default', 'chime', 'pop', 'marimba', 'whistle', 'djembe'];

export function useMessageNotification() {
  const { settings } = useSettings();
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const hasAttemptedUnlockRef = useRef(false);

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      return audioContextRef.current;
    }
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('[MessageNotification] 🔊 AudioContext created, state:', audioContextRef.current.state);
    return audioContextRef.current;
  }, []);

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    if (hasAttemptedUnlockRef.current) return;
    hasAttemptedUnlockRef.current = true;

    const unlock = () => {
      try {
        const ctx = initAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            console.log('[MessageNotification] 🔓 AudioContext unlocked via gesture, state:', ctx.state);
          }).catch(() => undefined);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [initAudioContext]);

  const playNotificationSound = useCallback((soundType: SoundName = 'default') => {
    console.log('[MessageNotification] 🎵 playNotificationSound called:', soundType, 'isPlaying:', isPlayingRef.current);

    if (isPlayingRef.current) {
      console.log('[MessageNotification] ⏭️ Skipping — already playing');
      return;
    }
    if (soundType === 'none') return;

    const player = SOUND_PLAYERS[soundType];
    if (!player) {
      console.warn('[MessageNotification] ❌ No player for sound type:', soundType);
      return;
    }

    const doPlay = (ctx: AudioContext) => {
      console.log('[MessageNotification] ▶️ Playing sound, AudioContext state:', ctx.state);
      isPlayingRef.current = true;
      try {
        player(ctx);
      } catch (error) {
        console.warn('[MessageNotification] Error in player:', error);
      }
      setTimeout(() => { isPlayingRef.current = false; }, 600);
    };

    try {
      // Create a fresh AudioContext each time for mobile compatibility
      // iOS Safari sometimes leaves contexts in unusable states
      let ctx = initAudioContext();

      const attemptPlay = () => {
        console.log('[MessageNotification] AudioContext state before play:', ctx.state);
        if (ctx.state === 'running') {
          doPlay(ctx);
        } else if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            console.log('[MessageNotification] AudioContext resumed, state:', ctx.state);
            if (ctx.state === 'running') {
              doPlay(ctx);
            } else {
              console.warn('[MessageNotification] AudioContext still not running after resume:', ctx.state);
            }
          }).catch((err) => {
            console.warn('[MessageNotification] Resume failed:', err);
          });
        } else {
          // closed — create new
          console.log('[MessageNotification] AudioContext closed, creating new one');
          audioContextRef.current = null;
          ctx = initAudioContext();
          ctx.resume().then(() => doPlay(ctx)).catch(() => undefined);
        }
      };

      attemptPlay();
    } catch (error) {
      console.warn('[MessageNotification] Error initializing audio:', error);
      isPlayingRef.current = false;
    }
  }, [initAudioContext]);

  const triggerVibration = useCallback((pattern: keyof typeof VIBRATION_PATTERNS = 'message') => {
    if (!isVibrationSupported()) return false;
    
    try {
      return navigator.vibrate(VIBRATION_PATTERNS[pattern]);
    } catch (error) {
      console.warn('[MessageNotification] Error triggering vibration:', error);
      return false;
    }
  }, []);

  const notify = useCallback((type: 'message' | 'reaction' | 'mention' = 'message') => {
    if (!settings?.notifications_enabled) {
      console.log('[MessageNotification] Notifications disabled');
      return;
    }

    if (isInQuietHours(
      settings.quiet_hours_enabled,
      settings.quiet_hours_start,
      settings.quiet_hours_end
    )) {
      console.log('[MessageNotification] In quiet hours, skipping notification');
      return;
    }

    const soundSettingRaw = settings.notification_sound || 'default';
    const soundSetting = String(soundSettingRaw).toLowerCase() as SoundName;
    if (soundSetting !== 'none') {
      const soundType = ALL_SOUND_NAMES.includes(soundSetting) ? soundSetting : 'default';
      playNotificationSound(soundType);
    }

    if (settings.vibration_enabled) {
      triggerVibration(type);
    }
  }, [settings, playNotificationSound, triggerVibration]);

  const notifyMessage = useCallback(() => notify('message'), [notify]);
  const notifyReaction = useCallback(() => notify('reaction'), [notify]);
  const notifyMention = useCallback(() => notify('mention'), [notify]);

  return {
    notify,
    notifyMessage,
    notifyReaction,
    notifyMention,
    playNotificationSound,
    triggerVibration,
  };
}
