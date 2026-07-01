import { useEffect, useRef, useState } from 'react';
import { Track, TrackEvent } from 'livekit-client';

interface VideoTrackProps {
  track: Track;
  className?: string;
  muted?: boolean;
}

export function VideoTrack({ track, className = '', muted = false }: VideoTrackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAttached, setIsAttached] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track) return;

    console.log('[VideoTrack] Attaching track:', track.kind, track.sid);

    // Attach the track to the video element
    track.attach(el);
    setIsAttached(true);

    // Force play after attach
    const tryPlay = () => {
      el.play().catch((err) => {
        console.log('[VideoTrack] Autoplay blocked, will retry on interaction:', err.message);
      });
    };
    
    tryPlay();

    // Listen for track events to handle reattachment
    const handleEnded = () => {
      console.log('[VideoTrack] Track ended, will reattach if possible');
      track.attach(el);
      tryPlay();
    };

    track.on(TrackEvent.Ended, handleEnded);

    // Also handle window interaction for autoplay recovery
    const handleInteraction = () => {
      if (el.paused) {
        tryPlay();
      }
    };
    
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      track.detach(el);
      track.off(TrackEvent.Ended, handleEnded);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      setIsAttached(false);
    };
  }, [track]);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted={muted}
      style={{ backgroundColor: 'black' }}
    />
  );
}
