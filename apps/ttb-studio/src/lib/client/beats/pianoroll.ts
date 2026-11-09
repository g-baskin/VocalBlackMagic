import type { BeatNote } from '@vbm/contracts';

export const snapOptions = [
  { label: 'None', ticks: 1 },
  { label: '1/6 step', ticks: 4 },
  { label: '1/4 step', ticks: 6 },
  { label: '1/3 step', ticks: 8 },
  { label: '1/2 step', ticks: 12 },
  { label: 'Step', ticks: 24 },
  { label: '1/2 beat', ticks: 48 },
  { label: 'Beat', ticks: 96 },
  { label: 'Bar', ticks: 384 }
] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The grid line at or before a tick. */
export const snapDown = (tick: number, grid: number) => Math.floor(tick / grid) * grid;
/** A drag distance rounded to whole grid units. */
export const snapDelta = (delta: number, grid: number) => Math.round(delta / grid) * grid;

export type Hit = { index: number; part: 'body' | 'end' } | null;

/** The note under a point (the last drawn wins); its last `edge` ticks resize it. */
export function hitTest(notes: readonly BeatNote[], tick: number, key: number, edge = 6): Hit {
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    if (n.key !== key || tick < n.start || tick >= n.start + n.length) continue;
    const grip = Math.min(edge, n.length / 3);
    return { index: i, part: tick >= n.start + n.length - grip ? 'end' : 'body' };
  }
  return null;
}

/** Moves the chosen notes together, stopping the whole group at the pattern and key range. */
export function moveNotes(
  notes: readonly BeatNote[],
  indices: readonly number[],
  dTick: number,
  dKey: number,
  patternTicks: number
): BeatNote[] {
  const chosen = indices.map((i) => notes[i]).filter(Boolean);
  if (!chosen.length) return notes.slice();
  const minStart = Math.min(...chosen.map((n) => n.start));
  const maxStart = Math.max(...chosen.map((n) => n.start));
  const minKey = Math.min(...chosen.map((n) => n.key));
  const maxKey = Math.max(...chosen.map((n) => n.key));
  const t = clamp(dTick, -minStart, patternTicks - 1 - maxStart);
  const k = clamp(dKey, -minKey, 127 - maxKey);
  const set = new Set(indices);
  return notes.map((n, i) => (set.has(i) ? { ...n, start: n.start + t, key: n.key + k } : n));
}

/** Lengthens or shortens the chosen notes by the same amount, never below `min` ticks. */
export function resizeNotes(
  notes: readonly BeatNote[],
  indices: readonly number[],
  dLength: number,
  min: number,
  patternTicks: number
): BeatNote[] {
  const set = new Set(indices);
  return notes.map((n, i) =>
    set.has(i) ? { ...n, length: clamp(n.length + dLength, Math.max(1, min), patternTicks) } : n
  );
}

/** Adds a note; returns the new list and the new note's index. */
export function drawNote(
  notes: readonly BeatNote[],
  tick: number,
  key: number,
  length: number,
  velocity: number,
  patternTicks: number
): { notes: BeatNote[]; index: number } {
  const note: BeatNote = {
    key: clamp(Math.round(key), 0, 127),
    start: clamp(Math.round(tick), 0, patternTicks - 1),
    length: clamp(Math.round(length), 1, patternTicks),
    velocity: clamp(Math.round(velocity), 1, 127)
  };
  return { notes: [...notes, note], index: notes.length };
}

export function eraseAt(notes: readonly BeatNote[], tick: number, key: number): BeatNote[] {
  const hit = hitTest(notes, tick, key, 0);
  return hit ? notes.filter((_, i) => i !== hit.index) : notes.slice();
}

export function removeNotes(notes: readonly BeatNote[], indices: readonly number[]): BeatNote[] {
  const set = new Set(indices);
  return notes.filter((_, i) => !set.has(i));
}

/** Indices of notes that overlap a box of ticks [t0, t1) and keys [k0, k1]. */
export function notesInRect(
  notes: readonly BeatNote[],
  t0: number,
  t1: number,
  k0: number,
  k1: number
): number[] {
  const [a, b] = [Math.min(t0, t1), Math.max(t0, t1)];
  const [lo, hi] = [Math.min(k0, k1), Math.max(k0, k1)];
  const out: number[] = [];
  notes.forEach((n, i) => {
    if (n.key >= lo && n.key <= hi && n.start < b && n.start + n.length > a) out.push(i);
  });
  return out;
}

export function setVelocity(
  notes: readonly BeatNote[],
  indices: readonly number[],
  velocity: number
): BeatNote[] {
  const v = clamp(Math.round(velocity), 1, 127);
  const set = new Set(indices);
  return notes.map((n, i) => (set.has(i) ? { ...n, velocity: v } : n));
}

/** Sorts by time then key, carrying a selection of indices across the reorder. */
export function sortNotes(
  notes: readonly BeatNote[],
  selected: readonly number[] = []
): { notes: BeatNote[]; selected: number[] } {
  const chosen = new Set(selected);
  const order = notes
    .map((n, i) => ({ n, i }))
    .sort((a, b) => a.n.start - b.n.start || a.n.key - b.n.key || a.i - b.i);
  return {
    notes: order.map((o) => o.n),
    selected: order.flatMap((o, j) => (chosen.has(o.i) ? [j] : []))
  };
}
