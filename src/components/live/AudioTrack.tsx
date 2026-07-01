import { useEffect, useRef } from 'react';
import { Track } from 'livekit-client';

interface AudioTrackProps {
  track: Track;
  muted?: boolean;
}

export function AudioTrack({ track, muted = false }: AudioTrackProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;

    track.attach(el);

    // Some browsers need explicit play() call
    el.play().catch(() => {
      // ignore autoplay blocking
    });

    return () => {
      track.detach(el);
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay playsInline muted={muted} />;
}
