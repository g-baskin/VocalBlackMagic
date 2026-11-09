import type { Kit, SoundMeta } from '@vbm/contracts';
import { gridSeconds, planLaunch } from './launch';
import { busSettings, dbToGain, macroTargets, velocityGain } from './macros';

export const maxVoices = 32;

export interface LoadedSound {
  meta: SoundMeta;
  forward: AudioBuffer;
  reversed: AudioBuffer;
}

export function reverseBuffer(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBuffer {
  const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = out.getChannelData(c);
    for (let i = 0, j = src.length - 1; i < src.length; i++, j--) dst[i] = src[j];
  }
  return out;
}

/** Decaying stereo noise; seeded so live play and offline export use the same room. */
export function impulseResponse(ctx: BaseAudioContext, size: number): AudioBuffer {
  const seconds = 0.4 + size * 4;
  const length = Math.max(1, Math.round(seconds * ctx.sampleRate));
  const ir = ctx.createBuffer(2, length, ctx.sampleRate);
  let seed = 0x9e3779b9;
  for (let c = 0; c < 2; c++) {
    const data = ir.getChannelData(c);
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      data[i] = noise * (1 - i / length) ** (2 + (1 - size) * 4);
    }
  }
  return ir;
}

function crushCurve(bits: number): Float32Array<ArrayBuffer> | null {
  if (bits >= 16) return null;
  const steps = 2 ** Math.max(1, bits - 1);
  const n = 4096;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

function driveCurve(amount: number): Float32Array<ArrayBuffer> | null {
  if (amount <= 0) return null;
  const k = 1 + amount * 30;
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/** Seconds of tail the reverb and delay sends can add after the dry sound ends. */
export function tailSeconds(kit: Kit): number {
  const s = busSettings(kit);
  let tail = 0.3;
  if (s.reverbMix > 0) tail += 0.4 + s.reverbSize * 4;
  if (s.delayMix > 0) tail += gridSeconds(kit.fx.delay_time, kit.bpm) * 8;
  return tail;
}

/** The kit bus: lo-fi, drive, shelves, whole-kit filter, reverb and delay sends, volume, ceiling. */
export class KitBus {
  readonly input: GainNode;
  private readonly crush: WaveShaperNode;
  private readonly drive: WaveShaperNode;
  private readonly low: BiquadFilterNode;
  private readonly high: BiquadFilterNode;
  private readonly filter: BiquadFilterNode;
  private readonly reverbSend: GainNode;
  private readonly reverb: ConvolverNode;
  private readonly delaySend: GainNode;
  private readonly delay: DelayNode;
  private readonly feedback: GainNode;
  private readonly volume: GainNode;
  private readonly ceiling: DynamicsCompressorNode;
  private reverbSize = -1;
  private crushBits = -1;
  private driveAmount = -1;

  constructor(
    private readonly ctx: BaseAudioContext,
    kit: Kit
  ) {
    this.input = ctx.createGain();
    this.crush = ctx.createWaveShaper();
    this.drive = ctx.createWaveShaper();
    this.drive.oversample = '2x';
    this.low = ctx.createBiquadFilter();
    this.low.type = 'lowshelf';
    this.low.frequency.value = 120;
    this.high = ctx.createBiquadFilter();
    this.high.type = 'highshelf';
    this.high.frequency.value = 8000;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.reverbSend = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.delaySend = ctx.createGain();
    this.delay = ctx.createDelay(8);
    this.feedback = ctx.createGain();
    this.volume = ctx.createGain();
    this.ceiling = ctx.createDynamicsCompressor();
    // Fast, hard compressor: an approximate ceiling, not a true-peak limiter.
    this.ceiling.knee.value = 0;
    this.ceiling.ratio.value = 20;
    this.ceiling.attack.value = 0.001;
    this.ceiling.release.value = 0.08;

    this.input.connect(this.crush);
    this.crush.connect(this.drive);
    this.drive.connect(this.low);
    this.low.connect(this.high);
    this.high.connect(this.filter);
    this.filter.connect(this.volume);
    this.filter.connect(this.reverbSend);
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.volume);
    this.filter.connect(this.delaySend);
    this.delaySend.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.volume);
    this.volume.connect(this.ceiling);
    this.ceiling.connect(ctx.destination);
    this.update(kit, true);
  }

  update(kit: Kit, immediate = false): void {
    const s = busSettings(kit);
    const t = immediate ? 0 : this.ctx.currentTime;
    const set = (param: AudioParam, value: number) => {
      if (immediate) param.value = value;
      else param.setTargetAtTime(value, t, 0.02);
    };
    if (s.crushBits !== this.crushBits) {
      this.crushBits = s.crushBits;
      this.crush.curve = crushCurve(s.crushBits);
    }
    if (s.drive !== this.driveAmount) {
      this.driveAmount = s.drive;
      this.drive.curve = driveCurve(s.drive);
    }
    if (Math.abs(s.reverbSize - this.reverbSize) > 0.02) {
      this.reverbSize = s.reverbSize;
      this.reverb.buffer = impulseResponse(this.ctx, s.reverbSize);
    }
    set(this.low.gain, s.lowShelfDb);
    set(this.high.gain, s.highShelfDb);
    set(this.filter.frequency, s.cutoffHz);
    set(this.filter.Q, s.reso);
    set(this.reverbSend.gain, s.reverbMix);
    set(this.delaySend.gain, s.delayMix);
    set(this.delay.delayTime, Math.min(8, gridSeconds(kit.fx.delay_time, kit.bpm)));
    set(this.feedback.gain, s.delayFeedback);
    set(this.volume.gain, dbToGain(s.volumeDb));
    this.ceiling.threshold.value = s.ceilingDb;
  }

  disconnect(): void {
    this.ceiling.disconnect();
  }
}

export interface Voice {
  pad: number;
  startedAt: number;
  startAt: number;
  hitAt: number;
  ends: number;
  source: AudioBufferSourceNode;
  amp: GainNode;
  release: number;
  gated: boolean;
}

/**
 * Playback rate of a pad layer: the sync stretch (pre-hit part to one grid step, after the
 * kit pitch is applied) times the kit pitch. launch is the stretch alone.
 */
export function launchRate(
  kit: Kit,
  pad: number,
  hit: number,
  natural = false
): { launch: number; total: number } {
  const p = kit.pads[pad];
  const pitch = 2 ** (kit.whole.pitch_st / 12);
  if (natural || !p || p.launch.lands_on === 'natural' || !p.launch.sync)
    return { launch: 1, total: pitch };
  const plan = planLaunch({
    now: 0,
    origin: 0,
    grid: p.launch.lands_on,
    bpm: kit.bpm,
    hit: hit / pitch,
    sync: true
  });
  return { launch: plan.rate, total: plan.rate * pitch };
}

/** Starts every layer of a pad. Pure Web Audio, so the live engine and offline export share it. */
export function startPad(
  ctx: BaseAudioContext,
  bus: KitBus,
  kit: Kit,
  pad: number,
  sounds: ReadonlyMap<string, LoadedSound>,
  velocity: number,
  timing: { now: number; origin: number; natural?: boolean }
): Voice[] {
  const p = kit.pads[pad];
  if (!p) return [];
  const macros = macroTargets(kit.macros);
  const voices: Voice[] = [];
  for (const [layer, id] of p.layers.entries()) {
    const sound = id ? sounds.get(id) : undefined;
    if (!sound) continue;
    const params = kit.layers[layer].tone;
    const buffer = p.launch.reverse ? sound.reversed : sound.forward;
    const hit = p.launch.reverse
      ? Math.max(0, sound.meta.duration_seconds - sound.meta.hit_seconds)
      : sound.meta.hit_seconds;
    const rate = launchRate(kit, pad, hit, timing.natural);
    const plan = planLaunch({
      now: timing.now,
      origin: timing.origin,
      grid: timing.natural ? 'natural' : p.launch.lands_on,
      bpm: kit.bpm,
      // Played time to the hit; the stretch is already in the rate.
      hit: hit / rate.total,
      sync: false
    });
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate.total;
    source.loop = p.launch.mode === 'loop';
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = params.cutoff_hz;
    filter.Q.value = params.reso;
    const amp = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.pan.value = params.pan;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(pan);
    pan.connect(bus.input);
    const level = dbToGain(params.level_db) * velocityGain(velocity, kit.whole.velocity);
    const attack = Math.max(
      0.002,
      (kit.whole.attack_ms + params.attack_ms + macros.attackMs) / 1000
    );
    const release = Math.max(0.01, (kit.whole.release_ms + params.release_ms) / 1000);
    amp.gain.setValueAtTime(0, plan.startAt);
    amp.gain.linearRampToValueAtTime(level, plan.startAt + attack);
    source.start(plan.startAt);
    const ends = source.loop ? Infinity : plan.startAt + buffer.duration / rate.total;
    if (!source.loop && p.launch.mode === 'one-shot') {
      // A 10 ms fade at the very end avoids a click when the buffer stops.
      const fadeAt = Math.max(plan.startAt + attack, ends - 0.01);
      amp.gain.setValueAtTime(level, fadeAt);
      amp.gain.linearRampToValueAtTime(0, ends);
    }
    source.onended = () => {
      source.disconnect();
      pan.disconnect();
    };
    voices.push({
      pad,
      startedAt: timing.now,
      startAt: plan.startAt,
      hitAt: plan.hitAt,
      ends,
      source,
      amp,
      release,
      gated: p.launch.mode !== 'one-shot'
    });
  }
  return voices;
}

export function releaseVoice(ctx: BaseAudioContext, voice: Voice, fast = false): void {
  const now = ctx.currentTime;
  const time = fast ? 0.005 : voice.release;
  if (now < voice.startAt) {
    voice.source.stop();
    return;
  }
  voice.amp.gain.cancelScheduledValues(now);
  voice.amp.gain.setValueAtTime(voice.amp.gain.value, now);
  voice.amp.gain.linearRampToValueAtTime(0, now + time);
  try {
    voice.source.stop(now + time + 0.01);
  } catch {
    // Already stopped.
  }
}

/**
 * Pads sounding at a context time, with progress 0–1 through the longest layer (null for loops).
 * A pad waiting for its grid start counts as playing at 0.
 */
export function playingPads(
  voices: readonly Pick<Voice, 'pad' | 'startAt' | 'ends'>[],
  now: number
): { pad: number; progress: number | null }[] {
  const byPad = new Map<number, number | null>();
  for (const v of voices) {
    if (v.ends <= now) continue;
    const progress =
      v.ends === Infinity
        ? null
        : Math.min(1, Math.max(0, (now - v.startAt) / Math.max(1e-6, v.ends - v.startAt)));
    const prev = byPad.get(v.pad);
    byPad.set(v.pad, prev === null || progress === null ? null : Math.min(prev ?? 1, progress));
  }
  return [...byPad].map(([pad, progress]) => ({ pad, progress })).sort((a, b) => a.pad - b.pad);
}

/** Live engine: one AudioContext, decoded-sound cache and a 32-voice pool with oldest stealing. */
export class PadEngine {
  readonly ctx: AudioContext;
  private bus: KitBus;
  private voices: Voice[] = [];
  readonly sounds = new Map<string, LoadedSound>();
  private loading = new Map<string, Promise<LoadedSound | null>>();
  private previewSource: AudioBufferSourceNode | null = null;

  constructor(private kit: Kit) {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    this.bus = new KitBus(this.ctx, kit);
  }

  setKit(kit: Kit): void {
    this.kit = kit;
    this.bus.update(kit);
  }

  async resume(): Promise<void> {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  /** Fetches and decodes a sound once; null when it is missing from the library. */
  load(meta: SoundMeta): Promise<LoadedSound | null> {
    const cached = this.sounds.get(meta.id);
    if (cached) return Promise.resolve(cached);
    let pending = this.loading.get(meta.id);
    if (!pending) {
      pending = (async () => {
        const response = await fetch(
          '/api/studio/sounds/' + encodeURIComponent(meta.id) + '/audio'
        );
        if (!response.ok) return null;
        const forward = await this.ctx.decodeAudioData(await response.arrayBuffer());
        const loaded = { meta, forward, reversed: reverseBuffer(this.ctx, forward) };
        this.sounds.set(meta.id, loaded);
        return loaded;
      })().finally(() => this.loading.delete(meta.id));
      this.loading.set(meta.id, pending);
    }
    return pending;
  }

  /** Plays a pad; returns when its hit will sound (context time) or null if nothing played. */
  trigger(pad: number, velocity = 100, natural = false): { hitAt: number; startAt: number } | null {
    const now = this.ctx.currentTime;
    this.voices = this.voices.filter((v) => v.ends > now);
    const started = startPad(this.ctx, this.bus, this.kit, pad, this.sounds, velocity, {
      now,
      origin: 0,
      natural
    });
    if (!started.length) return null;
    this.voices.push(...started);
    while (this.voices.length > maxVoices) {
      const oldest = this.voices.shift();
      if (oldest) releaseVoice(this.ctx, oldest, true);
    }
    return { hitAt: started[0].hitAt, startAt: Math.min(...started.map((v) => v.startAt)) };
  }

  /** Gate and loop pads stop on release; one-shots play out. */
  release(pad: number): void {
    for (const voice of this.voices.filter((v) => v.pad === pad && v.gated)) {
      releaseVoice(this.ctx, voice);
      voice.ends = this.ctx.currentTime + voice.release;
      voice.gated = false;
    }
  }

  /** What is sounding now, for the pad glow and the Playing list. */
  playing(): { pad: number; progress: number | null }[] {
    const now = this.ctx.currentTime;
    this.voices = this.voices.filter((v) => v.ends > now);
    return playingPads(this.voices, now);
  }

  /** Stops one pad at once, whatever its mode. */
  stopPad(pad: number): void {
    for (const voice of this.voices.filter((v) => v.pad === pad))
      releaseVoice(this.ctx, voice, true);
    this.voices = this.voices.filter((v) => v.pad !== pad);
  }

  stopAll(): void {
    for (const voice of this.voices) releaseVoice(this.ctx, voice, true);
    this.voices = [];
    try {
      this.previewSource?.stop();
    } catch {
      // Already finished.
    }
    this.previewSource = null;
  }

  /** Auditions a single sound straight through the bus, outside any pad. */
  preview(id: string): void {
    const sound = this.sounds.get(id);
    if (!sound) return;
    try {
      this.previewSource?.stop();
    } catch {
      // Already finished.
    }
    const source = this.ctx.createBufferSource();
    source.buffer = sound.forward;
    source.connect(this.bus.input);
    source.onended = () => {
      source.disconnect();
      if (this.previewSource === source) this.previewSource = null;
    };
    source.start();
    this.previewSource = source;
  }

  async close(): Promise<void> {
    this.stopAll();
    this.bus.disconnect();
    await this.ctx.close();
  }
}
