/**
 * Advanced notification sound synthesizer using Web Audio API.
 * Each sound uses multiple oscillators, harmonics, and proper envelopes
 * for richer, more realistic tones.
 */

export type SoundName = 'default' | 'chime' | 'pop' | 'marimba' | 'whistle' | 'djembe' | 'none';

export const SOUND_LABELS: Record<SoundName, string> = {
  default: 'Clássico',
  chime: 'Sino',
  pop: 'Pop',
  marimba: 'Marimba',
  whistle: 'Assobio',
  djembe: 'Djembê',
  none: 'Nenhum',
};

type SoundPlayer = (ctx: AudioContext) => void;

/** Helper: create an oscillator note with gain envelope */
function playNote(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  volume: number,
  destination: AudioNode,
  detune = 0,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (detune) osc.detune.setValueAtTime(detune, startTime);

  // Smooth envelope: attack → sustain → release
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
  gain.gain.setValueAtTime(volume, startTime + duration * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
  return osc;
}

/** Classic: Two-tone ascending (like iOS text tone) */
const playDefault: SoundPlayer = (ctx) => {
  const t = ctx.currentTime;
  // Fundamental tones
  playNote(ctx, 1175, 'sine', t, 0.15, 0.45, ctx.destination); // D6
  playNote(ctx, 1568, 'sine', t + 0.16, 0.22, 0.5, ctx.destination); // G6
  // Soft harmonics for richness
  playNote(ctx, 2350, 'sine', t, 0.12, 0.12, ctx.destination); // octave
  playNote(ctx, 3136, 'sine', t + 0.16, 0.18, 0.1, ctx.destination);
};

/** Chime: Crystalline bell with harmonics */
const playChime: SoundPlayer = (ctx) => {
  const t = ctx.currentTime;
  const freqs = [1047, 1319, 1568]; // C6, E6, G6 (major triad)
  freqs.forEach((f, i) => {
    const start = t + i * 0.12;
    // Fundamental
    playNote(ctx, f, 'sine', start, 0.35, 0.35, ctx.destination);
    // Bell-like harmonic (2.76× for inharmonic shimmer)
    playNote(ctx, f * 2.76, 'sine', start, 0.2, 0.08, ctx.destination);
    // Soft 2nd harmonic
    playNote(ctx, f * 2, 'sine', start, 0.25, 0.06, ctx.destination);
  });
};

/** Pop: Bubbly two-note pop */
const playPop: SoundPlayer = (ctx) => {
  const t = ctx.currentTime;

  // First pop: frequency sweep down
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.connect(g1);
  g1.connect(ctx.destination);
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1400, t);
  osc1.frequency.exponentialRampToValueAtTime(600, t + 0.08);
  g1.gain.setValueAtTime(0.5, t);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc1.start(t);
  osc1.stop(t + 0.1);

  // Second pop: higher
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1800, t + 0.12);
  osc2.frequency.exponentialRampToValueAtTime(800, t + 0.2);
  g2.gain.setValueAtTime(0.55, t + 0.12);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc2.start(t + 0.12);
  osc2.stop(t + 0.22);
};

/** Marimba: Warm wooden mallet hit (African-inspired) */
const playMarimba: SoundPlayer = (ctx) => {
  const t = ctx.currentTime;
  const notes = [523, 659, 784]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const start = t + i * 0.14;
    // Fundamental with quick attack, medium decay (marimba-like)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.55, start + 0.005); // very fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4); // longer decay
    osc.start(start);
    osc.stop(start + 0.4);

    // 4× harmonic for wooden timbre
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 4, start);
    g2.gain.setValueAtTime(0, start);
    g2.gain.linearRampToValueAtTime(0.15, start + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
    osc2.start(start);
    osc2.stop(start + 0.15);

    // 10× inharmonic (gives that bar resonance)
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.connect(g3);
    g3.connect(ctx.destination);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 9.5, start);
    g3.gain.setValueAtTime(0, start);
    g3.gain.linearRampToValueAtTime(0.04, start + 0.002);
    g3.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
    osc3.start(start);
    osc3.stop(start + 0.06);
  });
};

/** Whistle: Short melodic whistle */
const playWhistle: SoundPlayer = (ctx) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';

  // Pitch slides up then down
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.linearRampToValueAtTime(1400, t + 0.15);
  osc.frequency.linearRampToValueAtTime(1200, t + 0.3);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
  gain.gain.setValueAtTime(0.4, t + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

  osc.start(t);
  osc.stop(t + 0.35);

  // Airy noise layer
  const bufferSize = ctx.sampleRate * 0.35;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.03;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const ng = ctx.createGain();
  noise.connect(ng);
  ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.08, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.start(t);
  noise.stop(t + 0.35);
};

/** Djembê: Percussive hit with tonal body */
const playDjembe: SoundPlayer = (ctx) => {
  const t = ctx.currentTime;

  // Bass tone (body of drum)
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.start(t);
  osc.stop(t + 0.3);

  // Slap tone (high ring)
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(800, t);
  osc2.frequency.exponentialRampToValueAtTime(400, t + 0.05);
  g2.gain.setValueAtTime(0.4, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc2.start(t);
  osc2.stop(t + 0.12);

  // Second hit
  const osc3 = ctx.createOscillator();
  const g3 = ctx.createGain();
  osc3.connect(g3);
  g3.connect(ctx.destination);
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(200, t + 0.2);
  osc3.frequency.exponentialRampToValueAtTime(90, t + 0.35);
  g3.gain.setValueAtTime(0.5, t + 0.2);
  g3.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc3.start(t + 0.2);
  osc3.stop(t + 0.45);

  // Noise burst (skin contact)
  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const ng = ctx.createGain();
  noise.connect(ng);
  ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.25, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  noise.start(t);
  noise.stop(t + 0.05);
};

/** Map sound names to their player functions */
export const SOUND_PLAYERS: Record<Exclude<SoundName, 'none'>, SoundPlayer> = {
  default: playDefault,
  chime: playChime,
  pop: playPop,
  marimba: playMarimba,
  whistle: playWhistle,
  djembe: playDjembe,
};
