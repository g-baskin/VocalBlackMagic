import type { BeatProject } from '@vbm/contracts';
import { audibleChannels } from './schedule';

export const dbToGain = (db: number) => (db <= -60 ? 0 : 10 ** (db / 20));

interface Strip {
  input: GainNode;
  volume: GainNode;
  pan: StereoPannerNode;
  meter: AnalyserNode | null;
}

/** Channel strips (volume, pan, meter) into a master gain and a ceiling limiter. */
export class BeatMixer {
  readonly master: GainNode;
  private readonly limiter: DynamicsCompressorNode;
  private readonly masterMeter: AnalyserNode | null;
  private readonly strips = new Map<string, Strip>();
  private readonly scratch = new Float32Array(256);

  constructor(
    private readonly ctx: BaseAudioContext,
    project: BeatProject,
    private readonly meters = true
  ) {
    this.master = ctx.createGain();
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.08;
    this.master.connect(this.limiter);
    this.masterMeter = meters ? this.analyser() : null;
    if (this.masterMeter) this.limiter.connect(this.masterMeter).connect(ctx.destination);
    else this.limiter.connect(ctx.destination);
    this.update(project, true);
  }

  private analyser(): AnalyserNode {
    const a = this.ctx.createAnalyser();
    a.fftSize = 256;
    return a;
  }

  private set(param: AudioParam, value: number, now: boolean) {
    // Exports start at their final settings; live changes glide to avoid clicks.
    if (now) param.value = value;
    else param.setTargetAtTime(value, this.ctx.currentTime, 0.015);
  }

  /** Adds, removes and retunes strips to match the project. */
  update(project: BeatProject, immediate = false): void {
    const audible = audibleChannels(project.channels);
    const ids = new Set(project.channels.map((c) => c.id));
    for (const [id, strip] of this.strips)
      if (!ids.has(id)) {
        strip.input.disconnect();
        strip.pan.disconnect();
        this.strips.delete(id);
      }
    for (const channel of project.channels) {
      let strip = this.strips.get(channel.id);
      const fresh = !strip;
      if (!strip) {
        const input = this.ctx.createGain();
        const volume = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();
        const meter = this.meters ? this.analyser() : null;
        input.connect(volume).connect(pan);
        if (meter) pan.connect(meter);
        pan.connect(this.master);
        strip = { input, volume, pan, meter };
        this.strips.set(channel.id, strip);
      }
      const gain = audible.has(channel.id) ? dbToGain(channel.mixer.volume_db) : 0;
      this.set(strip.volume.gain, gain, immediate || fresh);
      this.set(strip.pan.pan, channel.mixer.pan, immediate || fresh);
    }
    this.set(this.master.gain, dbToGain(project.master_db), immediate);
  }

  /** Where a channel's voices connect; null for a channel the mixer does not know. */
  input(channelId: string): AudioNode | null {
    return this.strips.get(channelId)?.input ?? null;
  }

  private peak(meter: AnalyserNode | null): number {
    if (!meter) return 0;
    meter.getFloatTimeDomainData(this.scratch);
    let peak = 0;
    for (const s of this.scratch) peak = Math.max(peak, Math.abs(s));
    return Math.min(1, peak);
  }

  /** Peak level 0 to 1 after the channel's fader and pan. */
  level(channelId: string): number {
    return this.peak(this.strips.get(channelId)?.meter ?? null);
  }

  masterLevel(): number {
    return this.peak(this.masterMeter);
  }

  disconnect(): void {
    for (const strip of this.strips.values()) {
      strip.input.disconnect();
      strip.pan.disconnect();
    }
    this.strips.clear();
    this.master.disconnect();
    this.limiter.disconnect();
  }
}
