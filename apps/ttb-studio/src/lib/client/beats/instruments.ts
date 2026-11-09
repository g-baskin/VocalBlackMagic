import type { BeatChannel, DrumKind, SynthParams } from '@vbm/contracts';
import type { BeatMixer } from './mixer';

export const maxLiveVoices = 64;
const hz = (key: number) => 440 * 2 ** ((key - 69) / 12);
const velocityGain = (velocity: number) => (Math.max(1, Math.min(127, velocity)) / 127) ** 1.6;

export interface BeatVoice {
  channel: string;
  key: number;
  startAt: number;
  /** When the voice is silent (Infinity while a held note waits for its release). */
  ends: number;
  /** When the note is let go; Infinity while held. */
  releaseAt: number;
  release(at: number): void;
  kill(at: number): void;
}

/** Seeded white noise, so live play and export sound the same. */
export function noiseBuffer(ctx: BaseAudioContext, seconds = 1): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 22222;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = seed / 2147483648 - 1;
  }
  return buffer;
}

function fade(param: AudioParam, at: number, tau: number) {
  param.cancelScheduledValues(at);
  param.setTargetAtTime(0, at, tau);
}

function stopSafely(node: AudioScheduledSourceNode, at: number) {
  try {
    node.stop(at);
  } catch {
    // Already stopped earlier.
  }
}

/** Three oscillators into a low-pass filter and an ADSR amp. */
export function synthVoice(
  ctx: BaseAudioContext,
  out: AudioNode,
  s: SynthParams,
  channel: string,
  key: number,
  velocity: number,
  at: number,
  glideFrom: number | null = null
): BeatVoice {
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = s.cutoff_hz;
  filter.Q.value = s.reso;
  filter.connect(amp).connect(out);
  const live = s.osc.filter((o) => o.level > 0);
  const total = live.reduce((n, o) => n + o.level, 0) || 1;
  const oscs: OscillatorNode[] = [];
  for (const o of live) {
    const osc = ctx.createOscillator();
    osc.type = o.wave;
    const target = hz(key + o.coarse);
    if (glideFrom !== null && s.glide_ms > 0) {
      osc.frequency.setValueAtTime(hz(glideFrom + o.coarse), at);
      osc.frequency.exponentialRampToValueAtTime(target, at + s.glide_ms / 1000);
    } else osc.frequency.value = target;
    osc.detune.value = o.fine;
    const level = ctx.createGain();
    level.gain.value = o.level / Math.max(1, total);
    osc.connect(level).connect(filter);
    osc.start(at);
    oscs.push(osc);
  }
  const peak = 0.45 * velocityGain(velocity);
  const attack = Math.max(0.002, s.attack_ms / 1000);
  amp.gain.setValueAtTime(0, at);
  amp.gain.linearRampToValueAtTime(peak, at + attack);
  amp.gain.setTargetAtTime(peak * s.sustain, at + attack, Math.max(0.005, s.decay_ms / 3000));
  const tau = Math.max(0.004, s.release_ms / 4000);
  const voice: BeatVoice = {
    channel,
    key,
    startAt: at,
    ends: Infinity,
    releaseAt: Infinity,
    release(t) {
      const when = Math.max(t, at + 0.005);
      fade(amp.gain, when, tau);
      voice.releaseAt = when;
      voice.ends = when + tau * 6;
      for (const osc of oscs) stopSafely(osc, voice.ends);
    },
    kill(t) {
      fade(amp.gain, t, 0.004);
      voice.releaseAt = Math.min(voice.releaseAt, t);
      voice.ends = Math.min(voice.ends, t + 0.03);
      for (const osc of oscs) stopSafely(osc, t + 0.03);
    }
  };
  if (oscs[0]) oscs[0].onended = () => amp.disconnect();
  else {
    // Every oscillator is off: nothing will sound, so do not keep the nodes connected.
    amp.disconnect();
    voice.ends = at;
    voice.release = () => {};
  }
  return voice;
}

interface Hit {
  /** Seconds until silent. */
  length: number;
  nodes: AudioScheduledSourceNode[];
}

function tone(
  ctx: BaseAudioContext,
  out: AudioNode,
  at: number,
  type: OscillatorType,
  from: number,
  to: number,
  sweep: number,
  level: number,
  decay: number
): AudioScheduledSourceNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.min(from, 20000), at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, Math.min(to, 20000)), at + sweep);
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, at);
  g.gain.exponentialRampToValueAtTime(0.0008, at + decay);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + decay + 0.02);
  return osc;
}

function hiss(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  at: number,
  type: BiquadFilterType,
  freq: number,
  q: number,
  level: number,
  decay: number,
  bursts: number[] = [0]
): AudioScheduledSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = Math.min(freq, ctx.sampleRate / 2 - 100);
  filter.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  // A clap is a few quick slaps then a tail.
  for (const b of bursts.slice(0, -1)) {
    g.gain.setValueAtTime(level, at + b);
    g.gain.exponentialRampToValueAtTime(level * 0.1, at + b + 0.009);
  }
  const lastBurst = bursts[bursts.length - 1];
  g.gain.setValueAtTime(level, at + lastBurst);
  g.gain.exponentialRampToValueAtTime(0.0008, at + lastBurst + decay);
  src.connect(filter).connect(g).connect(out);
  src.start(at);
  src.stop(at + lastBurst + decay + 0.02);
  return src;
}

function drumHit(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  kind: DrumKind,
  pitch: number,
  decay: number,
  at: number
): Hit {
  const d = Math.max(0.1, decay);
  switch (kind) {
    case 'kick':
      return {
        length: 0.5 * d,
        nodes: [
          tone(ctx, out, at, 'sine', 160 * pitch, 42 * pitch, 0.11, 1, 0.5 * d),
          tone(ctx, out, at, 'triangle', 1400 * pitch, 300, 0.01, 0.25, 0.012)
        ]
      };
    case 'snare':
      return {
        length: 0.24 * d,
        nodes: [
          tone(ctx, out, at, 'triangle', 220 * pitch, 165 * pitch, 0.05, 0.55, 0.12 * d),
          hiss(ctx, out, noise, at, 'highpass', 1600 * pitch, 0.7, 0.6, 0.22 * d)
        ]
      };
    case 'clap':
      return {
        length: 0.05 + 0.22 * d,
        nodes: [
          hiss(
            ctx,
            out,
            noise,
            at,
            'bandpass',
            1150 * pitch,
            1.1,
            0.9,
            0.22 * d,
            [0, 0.011, 0.023, 0.034]
          )
        ]
      };
    case 'hat':
      return {
        length: 0.06 * d,
        nodes: [hiss(ctx, out, noise, at, 'highpass', 7500 * pitch, 0.9, 0.45, 0.06 * d)]
      };
    case 'openhat':
      return {
        length: 0.38 * d,
        nodes: [hiss(ctx, out, noise, at, 'highpass', 7000 * pitch, 0.9, 0.4, 0.38 * d)]
      };
    case 'tom':
      return {
        length: 0.4 * d,
        nodes: [tone(ctx, out, at, 'sine', 240 * pitch, 120 * pitch, 0.18, 0.85, 0.4 * d)]
      };
    case 'perc': {
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 800 * pitch;
      band.Q.value = 2;
      band.connect(out);
      return {
        length: 0.2 * d,
        nodes: [
          tone(ctx, band, at, 'square', 540 * pitch, 540 * pitch, 0.01, 0.35, 0.2 * d),
          tone(ctx, band, at, 'square', 800 * pitch, 800 * pitch, 0.01, 0.35, 0.2 * d)
        ]
      };
    }
  }
}

/** One-shot drum voice; drums always play out, a release does nothing. */
export function drumVoice(
  ctx: BaseAudioContext,
  out: AudioNode,
  noise: AudioBuffer,
  kind: DrumKind,
  semitones: number,
  decay: number,
  channel: string,
  key: number,
  velocity: number,
  at: number
): BeatVoice {
  const amp = ctx.createGain();
  amp.gain.value = 0.9 * velocityGain(velocity);
  amp.connect(out);
  const hit = drumHit(ctx, amp, noise, kind, 2 ** (semitones / 12), decay, at);
  const voice: BeatVoice = {
    channel,
    key,
    startAt: at,
    ends: at + hit.length + 0.02,
    releaseAt: at,
    release() {},
    kill(t) {
      fade(amp.gain, t, 0.004);
      voice.ends = Math.min(voice.ends, t + 0.03);
      for (const n of hit.nodes) stopSafely(n, t + 0.03);
    }
  };
  hit.nodes[0].onended = () => amp.disconnect();
  return voice;
}

/** A Pads sound pitched by key against the channel's root key. */
export function samplerVoice(
  ctx: BaseAudioContext,
  out: AudioNode,
  buffer: AudioBuffer,
  gate: boolean,
  semitones: number,
  channel: string,
  key: number,
  velocity: number,
  at: number
): BeatVoice {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const rate = 2 ** (semitones / 12);
  src.playbackRate.value = rate;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, at);
  amp.gain.linearRampToValueAtTime(velocityGain(velocity), at + 0.002);
  src.connect(amp).connect(out);
  src.start(at);
  src.onended = () => amp.disconnect();
  const voice: BeatVoice = {
    channel,
    key,
    startAt: at,
    ends: at + buffer.duration / rate,
    releaseAt: gate ? Infinity : at,
    release(t) {
      if (!gate) return;
      const when = Math.max(t, at + 0.005);
      fade(amp.gain, when, 0.015);
      voice.releaseAt = when;
      voice.ends = Math.min(voice.ends, when + 0.1);
      stopSafely(src, voice.ends);
    },
    kill(t) {
      fade(amp.gain, t, 0.004);
      voice.ends = Math.min(voice.ends, t + 0.03);
      stopSafely(src, t + 0.03);
    }
  };
  return voice;
}

/**
 * Starts voices for channels on any context. Live play and offline export share it,
 * so both sound the same; only live play caps the voice count.
 */
export class Voicer {
  private voices: BeatVoice[] = [];
  private readonly last = new Map<string, BeatVoice>();
  private readonly noise: AudioBuffer;

  constructor(
    readonly ctx: BaseAudioContext,
    private readonly mixer: BeatMixer,
    private readonly buffers: ReadonlyMap<string, AudioBuffer>,
    private readonly maxVoices = Infinity
  ) {
    this.noise = noiseBuffer(ctx);
  }

  /** Starts a held note at `at`; null when the channel has nothing to play. */
  start(channel: BeatChannel, key: number, velocity: number, at: number): BeatVoice | null {
    const out = this.mixer.input(channel.id);
    if (!out) return null;
    if (this.maxVoices !== Infinity) {
      const now = this.ctx.currentTime;
      this.voices = this.voices.filter((v) => v.ends > now);
    }
    const inst = channel.instrument;
    let voice: BeatVoice | null = null;
    if (inst.kind === 'synth') {
      let glide: number | null = null;
      const prev = inst.synth.mono ? this.last.get(channel.id) : undefined;
      if (prev && prev.ends > at && prev.startAt <= at) {
        // Legato: glide only when the last note is still held.
        if (prev.releaseAt > at) glide = prev.key;
        prev.kill(at);
      }
      voice = synthVoice(this.ctx, out, inst.synth, channel.id, key, velocity, at, glide);
      this.last.set(channel.id, voice);
    } else if (inst.kind === 'drum') {
      const semis = inst.tune_st + key - channel.root_key;
      voice = drumVoice(
        this.ctx,
        out,
        this.noise,
        inst.drum,
        semis,
        inst.decay,
        channel.id,
        key,
        velocity,
        at
      );
    } else {
      const buffer = inst.sound_id ? this.buffers.get(inst.sound_id) : undefined;
      if (!buffer) return null;
      voice = samplerVoice(
        this.ctx,
        out,
        buffer,
        inst.mode === 'gate',
        key - channel.root_key,
        channel.id,
        key,
        velocity,
        at
      );
    }
    this.voices.push(voice);
    while (this.voices.length > this.maxVoices) this.voices.shift()?.kill(at);
    return voice;
  }

  /** A note with a known length (sequenced or exported). */
  note(
    channel: BeatChannel,
    key: number,
    velocity: number,
    at: number,
    seconds: number
  ): BeatVoice | null {
    const voice = this.start(channel, key, velocity, at);
    voice?.release(at + Math.max(0.01, seconds));
    return voice;
  }

  /** Latest time any started voice is still sounding. */
  lastEnd(): number {
    return this.voices.reduce((t, v) => Math.max(t, v.ends === Infinity ? v.startAt : v.ends), 0);
  }

  active(): number {
    const now = this.ctx.currentTime;
    return this.voices.filter((v) => v.ends > now && v.startAt <= now).length;
  }

  stopAll(at = this.ctx.currentTime): void {
    for (const v of this.voices) v.kill(at);
    this.voices = [];
    this.last.clear();
  }
}
