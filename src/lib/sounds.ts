// Web Audio API sound effects for the app

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Play a beep sound at a specific frequency
export function playBeep(frequency: number = 800, duration: number = 0.15, volume: number = 0.3) {
  try {
    const ctx = getAudioContext();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
}

// Countdown beep - gets higher pitched as countdown progresses
export function playCountdownBeep(number: number) {
  const frequencies: Record<number, number> = {
    3: 600,  // Lower pitch
    2: 800,  // Medium pitch
    1: 1000, // Higher pitch
  };
  playBeep(frequencies[number] || 800, 0.2, 0.4);
}

// Fanfare sound for going live
export function playGoLiveFanfare() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play a triumphant chord progression
    const notes = [
      { freq: 523.25, start: 0, duration: 0.15 },      // C5
      { freq: 659.25, start: 0.08, duration: 0.15 },   // E5
      { freq: 783.99, start: 0.16, duration: 0.15 },   // G5
      { freq: 1046.50, start: 0.24, duration: 0.4 },   // C6 (sustained)
    ];
    
    notes.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.25, now + note.start);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.duration);
      
      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration);
    });
  } catch (error) {
    console.warn('Fanfare playback failed:', error);
  }
}

// Success chime
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [
      { freq: 880, start: 0, duration: 0.1 },
      { freq: 1108.73, start: 0.1, duration: 0.2 },
    ];
    
    notes.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = note.freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, now + note.start);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.duration);
      
      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration);
    });
  } catch (error) {
    console.warn('Chime playback failed:', error);
  }
}

// Error/cancel sound
export function playErrorSound() {
  playBeep(300, 0.3, 0.3);
}
