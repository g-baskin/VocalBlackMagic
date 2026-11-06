import { describe, expect, test } from 'bun:test';
import { clampRegion, formatPrecise, nudge, timeAt } from './region';

describe('RegionSelect helpers', () => {
  test('clamps inside the song with a minimum length', () => {
    expect(clampRegion({ start: -5, end: 300 }, 120)).toEqual({ start: 0, end: 120 });
    expect(clampRegion({ start: 50, end: 50.2 }, 120, 1)).toEqual({ start: 50, end: 51 });
    expect(clampRegion({ start: 50, end: 50.2 }, 120, 1, Infinity, 'start')).toEqual({
      start: 49.2,
      end: 50.2
    });
    expect(clampRegion({ start: 119.8, end: 120 }, 120, 1)).toEqual({ start: 119, end: 120 });
    expect(clampRegion({ start: 10, end: 100 }, 120, 1, 30)).toEqual({ start: 10, end: 40 });
    expect(clampRegion({ start: 1, end: 2 }, 0)).toEqual({ start: 0, end: 0 });
  });
  test('a region exactly the minimum length, built from floats, is left alone', () => {
    // 2.3 - 1.3 is 0.9999999999999998 in floating point.
    expect(2.3 - 1.3 < 1).toBe(true);
    expect(clampRegion({ start: 1.3, end: 2.3 }, 10)).toEqual({ start: 1.3, end: 2.3 });
    expect(clampRegion({ start: 1.3, end: 2.3 }, 10, 1, Infinity, 'start')).toEqual({
      start: 1.3,
      end: 2.3
    });
  });

  test('keyboard nudges', () => {
    expect(nudge('ArrowRight', false, 10, 120)).toBeCloseTo(10.1);
    expect(nudge('ArrowLeft', true, 10, 120)).toBe(9);
    expect(nudge('End', false, 10, 120)).toBe(120);
    expect(nudge('a', false, 10, 120)).toBeNull();
  });
  test('pointer maths and readout', () => {
    expect(timeAt(150, 100, 200, 120)).toBe(30);
    expect(timeAt(0, 100, 200, 120)).toBe(0);
    expect(formatPrecise(65.34)).toBe('1:05.3');
    expect(formatPrecise(9.96)).toBe('0:10.0');
  });
});
