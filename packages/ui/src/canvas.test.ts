import { describe, expect, test } from 'bun:test';
import { signalColor } from './canvas';

describe('signal energy palette', () => {
  test('uses the displayed low and high color endpoints', () => {
    expect(signalColor(0)).toEqual([15, 20, 27]);
    expect(signalColor(1)).toEqual([255, 242, 233]);
  });
  test('bounds invalid values without changing the classic palette', () => {
    expect(signalColor(-1)).toEqual(signalColor(0));
    expect(signalColor(2)).toEqual(signalColor(1));
    expect(signalColor(Number.NaN)).toEqual(signalColor(0));
  });
  test('brightness rises with energy across the scale', () => {
    const luminance = (rgb: number[]) =>
      rgb
        .map((v) => {
          const n = v / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    let last = -1;
    for (let i = 0; i <= 100; i++) {
      const current = luminance(signalColor(i / 100));
      expect(current).toBeGreaterThan(last);
      last = current;
    }
  });
});
