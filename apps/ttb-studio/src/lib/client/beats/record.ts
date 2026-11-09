import type { BeatNote } from '@vbm/contracts';

/**
 * Turns live note-ons and note-offs at transport positions into pattern notes.
 * Positions are ticks into the looping pattern; a note held across the loop point wraps.
 */
export class Recorder {
  private readonly open = new Map<string, { key: number; velocity: number; start: number }>();

  constructor(
    private readonly loopTicks: number,
    /** Grid in ticks to snap starts and lengths to; 1 records as played. */
    private readonly quantise = 1
  ) {}

  noteOn(id: string, key: number, velocity: number, tick: number): void {
    this.open.set(id, { key, velocity, start: tick });
  }

  /** The finished note, or null when this id was not recording. */
  noteOff(id: string, tick: number): BeatNote | null {
    const held = this.open.get(id);
    if (!held) return null;
    this.open.delete(id);
    return this.make(held, tick);
  }

  /** Closes every held note (for stop); returns each with the id that started it. */
  flush(tick: number): { id: string; note: BeatNote }[] {
    const out = [...this.open].map(([id, h]) => ({ id, note: this.make(h, tick) }));
    this.open.clear();
    return out;
  }

  private make(held: { key: number; velocity: number; start: number }, end: number): BeatNote {
    const L = this.loopTicks;
    const q = Math.max(1, this.quantise);
    const raw = end >= held.start ? end - held.start : end + L - held.start;
    const start = (((Math.round(held.start / q) * q) % L) + L) % L;
    const length = Math.min(L, Math.max(q, Math.round(raw / q) * q));
    return {
      key: held.key,
      start: Math.min(L - 1, start),
      length: Math.max(1, length),
      velocity: Math.min(127, Math.max(1, Math.round(held.velocity)))
    };
  }
}
