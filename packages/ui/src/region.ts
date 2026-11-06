/** Pure helpers for RegionSelect: clamping, nudging and pointer-to-time maths. */

export interface Region {
  start: number;
  end: number;
}

const round = (s: number) => Math.round(s * 100) / 100;
/** Tolerance for floating-point error in length checks (well below the 0.01 s rounding). */
export const LENGTH_EPSILON = 1e-6;

/** Keeps 0 <= start < end <= total with end - start >= minLength (and <= maxLength if given). */
export function clampRegion(
  region: Region,
  total: number,
  minLength = 1,
  maxLength = Infinity,
  moved: 'start' | 'end' = 'end'
): Region {
  if (!(total > 0)) return { start: 0, end: 0 };
  const min = Math.min(minLength, total);
  const max = Math.max(min, Math.min(maxLength, total));
  let start = Math.min(Math.max(0, region.start), total - min);
  let end = Math.min(Math.max(min, region.end), total);
  if (moved === 'start') {
    if (end - start < min - LENGTH_EPSILON) start = end - min;
    if (end - start > max) start = end - max;
    start = Math.max(0, start);
    if (end - start < min - LENGTH_EPSILON) end = start + min;
  } else {
    if (end - start < min - LENGTH_EPSILON) end = start + min;
    if (end - start > max) end = start + max;
    end = Math.min(total, end);
    if (end - start < min - LENGTH_EPSILON) start = end - min;
  }
  return { start: round(start), end: round(end) };
}

/** Arrow keys nudge 0.1 s, shift 1 s; Home/End jump. Returns the new value or null for other keys. */
export function nudge(key: string, shift: boolean, value: number, total: number): number | null {
  const step = shift ? 1 : 0.1;
  if (key === 'ArrowRight' || key === 'ArrowUp') return value + step;
  if (key === 'ArrowLeft' || key === 'ArrowDown') return value - step;
  if (key === 'PageUp') return value + 10;
  if (key === 'PageDown') return value - 10;
  if (key === 'Home') return 0;
  if (key === 'End') return total;
  return null;
}

/** Seconds at a pointer x inside an element of the given left and width. */
export function timeAt(clientX: number, left: number, width: number, total: number): number {
  if (!(width > 0) || !(total > 0)) return 0;
  return Math.min(total, Math.max(0, ((clientX - left) / width) * total));
}

/** "1:05.3" style readout with tenths. */
export function formatPrecise(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.0';
  const tenths = Math.round(seconds * 10);
  const m = Math.floor(tenths / 600);
  const s = (tenths % 600) / 10;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}
