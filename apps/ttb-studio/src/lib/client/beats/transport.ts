import { ppq, type BeatProject } from '@vbm/contracts';
import { loopTicks, windowEvents, type PlayMode } from './schedule';

export const lookahead = { intervalMs: 25, horizonSeconds: 0.12 } as const;

/** What the transport needs from the audio side; the live engine provides it. */
export interface TransportSink {
  ctx: { currentTime: number; outputLatency?: number };
  note(channelId: string, key: number, velocity: number, at: number, seconds: number): void;
  click(at: number, accent: boolean): void;
  stopAll(): void;
}

export const secondsPerTick = (bpm: number) => 60 / (bpm * ppq);

/**
 * Lookahead scheduler: a 25 ms timer queues every note due in the next 120 ms on the
 * audio clock, so timing never depends on when the timer itself fires.
 */
export class Transport {
  playing = false;
  mode: PlayMode = 'pattern';
  patternId = '';
  metronome = false;
  private anchorTime = 0;
  private anchorTick = 0;
  private scheduledTo = 0;
  private bpm = 120;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly sink: TransportSink,
    private readonly project: () => BeatProject
  ) {}

  private tickAt(time: number): number {
    return this.anchorTick + (time - this.anchorTime) / secondsPerTick(this.bpm);
  }
  private timeAt(tick: number): number {
    return this.anchorTime + (tick - this.anchorTick) * secondsPerTick(this.bpm);
  }

  play(mode: PlayMode, patternId: string, fromTick = 0): void {
    this.stop();
    this.mode = mode;
    this.patternId = patternId;
    this.bpm = this.project().bpm;
    // A short lead-in so the first notes are not late.
    this.anchorTime = this.sink.ctx.currentTime + 0.05;
    this.anchorTick = fromTick;
    this.scheduledTo = fromTick;
    this.playing = true;
    this.pump();
    this.timer = setInterval(() => this.pump(), lookahead.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.playing) this.sink.stopAll();
    this.playing = false;
  }

  /** Schedules everything due before the horizon. Public so tests can drive it. */
  pump(): void {
    if (!this.playing) return;
    const project = this.project();
    const now = this.sink.ctx.currentTime;
    if (project.bpm !== this.bpm) {
      // Re-anchor at the current position so a tempo change does not jump.
      const tick = Math.max(this.anchorTick, this.tickAt(now));
      this.anchorTick = tick;
      this.anchorTime = Math.max(now, this.anchorTime);
      this.bpm = project.bpm;
    }
    const to = this.tickAt(now + lookahead.horizonSeconds);
    if (to <= this.scheduledTo) return;
    const spt = secondsPerTick(this.bpm);
    for (const e of windowEvents(project, this.mode, this.patternId, this.scheduledTo, to))
      this.sink.note(e.channel, e.key, e.velocity, this.timeAt(e.tick), e.length * spt);
    if (this.metronome) {
      const length = loopTicks(project, this.mode, this.patternId) || ppq * 4;
      for (let beat = Math.ceil(this.scheduledTo / ppq) * ppq; beat < to; beat += ppq)
        this.sink.click(this.timeAt(beat), (beat % length) % (ppq * 4) === 0);
    }
    this.scheduledTo = to;
  }

  /** Ticks into the current loop as heard now (output latency included), or null when stopped. */
  position(): { tick: number; loop: number } | null {
    if (!this.playing) return null;
    const heard = this.sink.ctx.currentTime - (this.sink.ctx.outputLatency ?? 0);
    const abs = Math.max(this.anchorTick, this.tickAt(heard));
    const loop = loopTicks(this.project(), this.mode, this.patternId);
    return { tick: abs, loop: loop > 0 ? abs % loop : 0 };
  }
}
