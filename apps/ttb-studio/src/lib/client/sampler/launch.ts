import type { LaunchGrid, SyncRate } from '@vbm/contracts';

const beats: Record<Exclude<LaunchGrid, 'natural'> | SyncRate, number> = {
  '1/16': 0.25,
  '1/8': 0.5,
  '1/4': 1,
  '1/2': 2,
  '1 bar': 4,
  '2 bars': 8,
  '4 bars': 16,
  '8 bars': 32
};

/** Length of a grid step in seconds at the given BPM; 0 for natural. */
export function gridSeconds(grid: LaunchGrid | SyncRate, bpm: number): number {
  return grid === 'natural' ? 0 : (beats[grid] * 60) / bpm;
}

export interface LaunchInput {
  /** Context time now. */
  now: number;
  /** Context time of bar 1, beat 1. */
  origin: number;
  grid: LaunchGrid;
  bpm: number;
  /** Seconds from the start of the (possibly reversed) buffer to its hit. */
  hit: number;
  sync: boolean;
  /** Scheduling margin so a start is never in the past. */
  lookahead?: number;
}

export interface LaunchPlan {
  startAt: number;
  rate: number;
  hitAt: number;
}

export const minRate = 0.25;
export const maxRate = 4;

/**
 * Natural plays at once. Otherwise the start is chosen so the hit lands on the next grid
 * boundary; with sync the pre-hit part is stretched (by playback rate) to one grid step.
 */
export function planLaunch(input: LaunchInput): LaunchPlan {
  const lookahead = input.lookahead ?? 0.05;
  if (input.grid === 'natural') {
    const startAt = input.now + 0.005;
    return { startAt, rate: 1, hitAt: startAt + input.hit };
  }
  const step = gridSeconds(input.grid, input.bpm);
  let rate = 1;
  if (input.sync && input.hit > 0.01) rate = Math.min(maxRate, Math.max(minRate, input.hit / step));
  const pre = input.hit / rate;
  const earliestHit = input.now + lookahead + pre - input.origin;
  // Small epsilon so float error on an exact boundary does not skip a whole step.
  const hitAt = input.origin + Math.ceil(earliestHit / step - 1e-9) * step;
  return { startAt: hitAt - pre, rate, hitAt };
}

/** Grid ticks for the waveform: buffer times (seconds) of each beat before the hit, at a rate. */
export function hitTicks(
  hit: number,
  bpm: number,
  rate: number
): { at: number; bar: number | null }[] {
  const beat = (60 / bpm) * rate;
  const out: { at: number; bar: number | null }[] = [];
  for (let k = 1; hit - k * beat >= 0 && k <= 256; k++)
    out.push({ at: hit - k * beat, bar: k % 4 === 0 ? -(k / 4) : null });
  return out;
}
