import { describe, expect, test } from 'bun:test';
import { computePeaks, computeSpectrogram, detectPitch, hzToNote } from './audio';

const SR = 44100;
function sine(hz: number, seconds: number, amp = 0.5): Float32Array {
  const out = new Float32Array(Math.floor(SR * seconds));
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * hz * i) / SR);
  return out;
}

describe('detectPitch', () => {
  test('440 Hz sine median within 2%', () => {
    const { hz } = detectPitch(sine(440, 1), SR);
    const voiced = Array.from(hz)
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    expect(voiced.length).toBeGreaterThan(hz.length * 0.9);
    const median = voiced[Math.floor(voiced.length / 2)];
    expect(Math.abs(median - 440) / 440).toBeLessThan(0.02);
  });
  test('silence is unvoiced', () => {
    const { hz, times } = detectPitch(new Float32Array(SR), SR);
    expect(times.length).toBeGreaterThan(0);
    expect(Array.from(hz).every((v) => v === 0)).toBe(true);
  });
});

describe('computePeaks', () => {
  test('bounds within signal range and bucket count', () => {
    const data = sine(100, 0.5, 0.8);
    const { min, max } = computePeaks(data, 64);
    expect(min.length).toBe(64);
    expect(max.length).toBe(64);
    for (let i = 0; i < 64; i++) {
      expect(min[i]).toBeGreaterThanOrEqual(-0.8001);
      expect(max[i]).toBeLessThanOrEqual(0.8001);
      expect(min[i]).toBeLessThanOrEqual(max[i]);
    }
    expect(Math.max(...max)).toBeGreaterThan(0.79);
  });
  test('empty input', () => {
    const { min } = computePeaks(new Float32Array(0), 10);
    expect(Array.from(min).every((v) => v === 0)).toBe(true);
  });
});

describe('computeSpectrogram', () => {
  test('1 kHz sine peaks near 1 kHz', () => {
    const { frames, binHz } = computeSpectrogram(sine(1000, 0.5), SR, { fftSize: 2048 });
    expect(frames.length).toBeGreaterThan(0);
    const frame = frames[Math.floor(frames.length / 2)];
    let best = 0;
    for (let k = 1; k < frame.length; k++) if (frame[k] > frame[best]) best = k;
    expect(Math.abs(best * binHz - 1000)).toBeLessThan(binHz * 1.5);
  });
});

describe('hzToNote', () => {
  test('names', () => {
    expect(hzToNote(440)).toBe('A4');
    expect(hzToNote(261.63)).toBe('C4');
  });
});

import { energyEnvelope, pitchClassHistogram, rmsDbfs, spectralCentroid } from './audio';

describe('voice-print helpers', () => {
  test('pitchClassHistogram buckets A and ignores unvoiced', () => {
    const h = pitchClassHistogram(new Float32Array([440, 220, 0, 261.63, 0]));
    expect(h[9]).toBeCloseTo(2 / 3, 5);
    expect(h[0]).toBeCloseTo(1 / 3, 5);
    expect(Array.from(pitchClassHistogram(new Float32Array([0, 0]))).every((v) => v === 0)).toBe(
      true
    );
  });
  test('rmsDbfs of full-scale sine is about -3 dB', () => {
    expect(rmsDbfs(sine(440, 1, 1))).toBeCloseTo(-3.01, 1);
    expect(rmsDbfs(new Float32Array(10))).toBe(-Infinity);
  });
  test('energyEnvelope peaks at 1 and sees silence', () => {
    const s = new Float32Array(SR);
    s.set(sine(440, 0.5), SR / 2);
    const env = energyEnvelope(s, 4);
    expect(env[0]).toBe(0);
    expect(Math.max(...env)).toBeCloseTo(1, 5);
  });
  test('spectralCentroid tracks a pure tone', () => {
    expect(Math.abs(spectralCentroid(sine(1000, 0.5), SR) - 1000)).toBeLessThan(60);
    expect(spectralCentroid(new Float32Array(SR), SR)).toBe(0);
  });
});
