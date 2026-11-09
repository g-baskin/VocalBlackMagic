import type { BeatChannel, BeatProject } from '@vbm/contracts';
import { maxLiveVoices, Voicer, type BeatVoice } from './instruments';
import { BeatMixer } from './mixer';

/** Live audio: one AudioContext, the mixer, decoded Pads sounds and a capped voice pool. */
export class BeatEngine {
  readonly ctx: AudioContext;
  readonly mixer: BeatMixer;
  readonly voicer: Voicer;
  readonly buffers = new Map<string, AudioBuffer>();
  private readonly loading = new Map<string, Promise<AudioBuffer | null>>();
  private project: BeatProject;

  constructor(project: BeatProject) {
    this.project = project;
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    this.mixer = new BeatMixer(this.ctx, project);
    this.voicer = new Voicer(this.ctx, this.mixer, this.buffers, maxLiveVoices);
  }

  setProject(project: BeatProject): void {
    this.project = project;
    this.mixer.update(project);
  }

  channel(id: string): BeatChannel | undefined {
    return this.project.channels.find((c) => c.id === id);
  }

  async resume(): Promise<void> {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  /** Fetches and decodes a Pads sound once; null when it is missing from the library. */
  load(soundId: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(soundId);
    if (cached) return Promise.resolve(cached);
    let pending = this.loading.get(soundId);
    if (!pending) {
      pending = (async () => {
        const response = await fetch(
          '/api/studio/sounds/' + encodeURIComponent(soundId) + '/audio'
        );
        if (!response.ok) return null;
        const buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(soundId, buffer);
        return buffer;
      })().finally(() => this.loading.delete(soundId));
      this.loading.set(soundId, pending);
    }
    return pending;
  }

  /** Every sampler sound the project uses; resolves to the ids that could not be loaded. */
  async loadAll(project: BeatProject): Promise<string[]> {
    const ids = new Set<string>();
    for (const c of project.channels)
      if (c.instrument.kind === 'sampler' && c.instrument.sound_id) ids.add(c.instrument.sound_id);
    const failed: string[] = [];
    await Promise.all(
      [...ids].map(async (id) => {
        const ok = await this.load(id).catch(() => null);
        if (!ok) failed.push(id);
      })
    );
    return failed;
  }

  /** Live key press; release it with noteOff. */
  noteOn(channelId: string, key: number, velocity: number): BeatVoice | null {
    const channel = this.channel(channelId);
    return channel ? this.voicer.start(channel, key, velocity, this.ctx.currentTime) : null;
  }

  noteOff(voice: BeatVoice): void {
    voice.release(this.ctx.currentTime);
  }

  /** A sequenced note at a context time. */
  note(channelId: string, key: number, velocity: number, at: number, seconds: number): void {
    const channel = this.channel(channelId);
    if (channel) this.voicer.note(channel, key, velocity, at, seconds);
  }

  /** Metronome click straight to the speakers; it is never in an export. */
  click(at: number, accent: boolean): void {
    const osc = this.ctx.createOscillator();
    osc.frequency.value = accent ? 1760 : 1175;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(accent ? 0.3 : 0.18, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(at);
    osc.stop(at + 0.06);
    osc.onended = () => g.disconnect();
  }

  stopAll(): void {
    this.voicer.stopAll();
  }

  async close(): Promise<void> {
    this.stopAll();
    this.mixer.disconnect();
    await this.ctx.close();
  }
}
