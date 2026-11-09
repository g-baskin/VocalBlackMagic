import { encodeWav } from './jobs';

const sampleRate = 44100;
export const midiRenderLimits = { maxSeconds: 600, maxNotes: 20000 } as const;

/** Oscillator for a General MIDI program (0-127), kept deliberately simple. */
export function voiceFor(program: number): {
  wave: OscillatorType;
  cutoff: number;
  release: number;
} {
  if (program < 8) return { wave: 'triangle', cutoff: 6000, release: 0.4 }; // pianos
  if (program < 24) return { wave: 'sine', cutoff: 8000, release: 0.3 }; // bells, organs
  if (program < 32) return { wave: 'sawtooth', cutoff: 3000, release: 0.2 }; // guitars
  if (program < 40) return { wave: 'sawtooth', cutoff: 900, release: 0.1 }; // basses
  if (program < 56) return { wave: 'sawtooth', cutoff: 2500, release: 0.6 }; // strings, choir
  if (program < 80) return { wave: 'square', cutoff: 3500, release: 0.2 }; // brass, reeds, pipes
  return { wave: 'sawtooth', cutoff: 4000, release: 0.5 }; // synths and the rest
}

const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 1;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  return buffer;
}

function drum(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  note: number,
  t: number,
  v: number
) {
  const gain = ctx.createGain();
  gain.connect(out);
  if (note === 35 || note === 36) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    gain.gain.setValueAtTime(v, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.32);
    return;
  }
  const hat = note === 42 || note === 44 || note === 46 || (note >= 49 && note <= 59);
  const snare = note === 38 || note === 40 || note === 37 || note === 39;
  const length = hat ? (note === 46 || note >= 49 ? 0.35 : 0.06) : snare ? 0.18 : 0.12;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = hat ? 'highpass' : 'bandpass';
  filter.frequency.value = hat ? 7000 : snare ? 1800 : 600 + (note % 12) * 80;
  gain.gain.setValueAtTime(v * (hat ? 0.35 : 0.7), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + length);
  src.connect(filter).connect(gain);
  src.start(t);
  src.stop(t + length + 0.02);
}

/** Renders a MIDI file to a WAV preview with a tiny built-in synth (channel 10 as drums). */
export async function renderMidi(
  bytes: ArrayBuffer
): Promise<{ wav: Blob; seconds: number; notes: number }> {
  // Loaded on demand: the MIDI parser is CommonJS and breaks server-side rendering of the page.
  const { Midi } = await import('@tonejs/midi');
  const midi = new Midi(bytes);
  const notes = midi.tracks.reduce((n, t) => n + t.notes.length, 0);
  if (!notes) throw new Error('This MIDI file has no notes to play.');
  if (notes > midiRenderLimits.maxNotes)
    throw new Error('This MIDI file has too many notes to preview.');
  const seconds = Math.min(midi.duration + 1, midiRenderLimits.maxSeconds);
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const master = ctx.createDynamicsCompressor();
  master.connect(ctx.destination);
  const bus = ctx.createGain();
  bus.gain.value = 0.25;
  bus.connect(master);
  const noise = noiseBuffer(ctx);
  for (const track of midi.tracks) {
    const percussion = track.channel === 9 || track.instrument.percussion;
    const voice = voiceFor(track.instrument.number);
    for (const note of track.notes) {
      const t = note.time;
      if (t >= seconds) continue;
      if (percussion) {
        drum(ctx, bus, noise, note.midi, t, note.velocity);
        continue;
      }
      const end = Math.min(t + Math.max(note.duration, 0.05), seconds - voice.release);
      const osc = ctx.createOscillator();
      osc.type = voice.wave;
      osc.frequency.value = hz(note.midi);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = voice.cutoff;
      const gain = ctx.createGain();
      const peak = 0.3 * note.velocity;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.01);
      gain.gain.setTargetAtTime(peak * 0.6, t + 0.01, 0.15);
      gain.gain.setTargetAtTime(0, Math.max(end, t + 0.02), voice.release / 4);
      osc.connect(filter).connect(gain).connect(bus);
      osc.start(t);
      osc.stop(Math.min(end + voice.release, seconds));
    }
  }
  const rendered = await ctx.startRendering();
  return { wav: encodeWav(rendered), seconds, notes };
}
