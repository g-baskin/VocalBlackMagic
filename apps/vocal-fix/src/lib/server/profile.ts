/** Descriptive, observable traits only: no identity, gender, age or other protected-trait guesses. */
export interface VoiceProfile {
  pitch_low_hz: number | null;
  pitch_high_hz: number | null;
  pitch_median_hz: number | null;
  brightness_hz: number;
  dynamics_db: number;
  breathiness: number;
  voiced_ratio: number;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function hzToNote(hz: number): string {
  const n = Math.round(12 * Math.log2(hz / 440)) + 69;
  return NOTES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
}

function fftMag(frame: Float32Array): Float32Array {
  const n = frame.length;
  const re = Float64Array.from(frame);
  const im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
  }
  const mag = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

/**
 * Normalised autocorrelation pitch (70-1000 Hz); null when not clearly periodic.
 * Picks the FIRST lag within 90% of the best peak, so sub-harmonic lags (2x, 3x the period,
 * which correlate almost as well) cannot report the note an octave or more too low.
 */
export function framePitch(frame: Float32Array, rate: number): number | null {
  const minLag = Math.floor(rate / 1000);
  const maxLag = Math.min(Math.floor(frame.length / 2), Math.ceil(rate / 70));
  const corr = new Float64Array(maxLag + 2);
  let best = 0;
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let s = 0;
    let e1 = 0;
    let e2 = 0;
    for (let i = 0; i + lag < frame.length; i++) {
      s += frame[i] * frame[i + lag];
      e1 += frame[i] * frame[i];
      e2 += frame[i + lag] * frame[i + lag];
    }
    corr[lag] = e1 > 0 && e2 > 0 ? s / Math.sqrt(e1 * e2) : 0;
    if (lag <= maxLag && corr[lag] > best) best = corr[lag];
  }
  if (best < 0.6) return null;
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    const c = corr[lag];
    if (c >= 0.9 * best && c >= corr[lag - 1] && c >= corr[lag + 1]) {
      const a = corr[lag - 1];
      const b = corr[lag + 1];
      const d = a - 2 * c + b;
      const shift = d !== 0 ? (0.5 * (a - b)) / d : 0;
      return rate / (lag + shift);
    }
  }
  return null;
}

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

export function analyzeProfile(pcm: Float32Array, rate: number): VoiceProfile {
  const N = 1024;
  const levels: number[] = [];
  const pitches: number[] = [];
  const centroids: number[] = [];
  const hfRatios: number[] = [];
  const frames: { start: number; db: number }[] = [];
  for (let i = 0; i + N <= pcm.length; i += N / 2) {
    let sum = 0;
    for (let j = i; j < i + N; j++) sum += pcm[j] * pcm[j];
    const dbv = 10 * Math.log10(sum / N + 1e-12);
    frames.push({ start: i, db: dbv });
  }
  if (!frames.length)
    return {
      pitch_low_hz: null,
      pitch_high_hz: null,
      pitch_median_hz: null,
      brightness_hz: 0,
      dynamics_db: 0,
      breathiness: 0,
      voiced_ratio: 0
    };
  const gate =
    pct(
      frames.map((f) => f.db),
      0.95
    ) - 30;
  const hann = Float32Array.from(
    { length: N },
    (_, k) => 0.5 - 0.5 * Math.cos((2 * Math.PI * k) / (N - 1))
  );
  for (const f of frames) {
    if (f.db < gate) continue;
    levels.push(f.db);
    const frame = pcm.subarray(f.start, f.start + N);
    const hz = framePitch(frame, rate);
    const win = Float32Array.from(frame, (v, k) => v * hann[k]);
    const mag = fftMag(win);
    let num = 0;
    let den = 0;
    let hf = 0;
    for (let k = 1; k < mag.length; k++) {
      const freq = (k * rate) / N;
      num += freq * mag[k];
      den += mag[k];
      if (freq > 4000) hf += mag[k];
    }
    if (den > 0) {
      centroids.push(num / den);
      if (hz) pitches.push(hz);
      else hfRatios.push(hf / den);
      if (hz) hfRatios.push((hf / den) * 0.5);
    }
  }
  const r = (x: number) => Math.round(x * 10) / 10;
  // Frames more than 1.5 octaves below the median are sub-harmonic errors or bleed, not the singer.
  if (pitches.length >= 5) {
    const mid = pct(pitches, 0.5);
    const kept = pitches.filter((hz) => hz >= mid / 2 ** 1.5);
    pitches.length = 0;
    pitches.push(...kept);
  }
  return {
    pitch_low_hz: pitches.length >= 5 ? r(pct(pitches, 0.1)) : null,
    pitch_high_hz: pitches.length >= 5 ? r(pct(pitches, 0.9)) : null,
    pitch_median_hz: pitches.length >= 5 ? r(pct(pitches, 0.5)) : null,
    brightness_hz: centroids.length ? Math.round(pct(centroids, 0.5)) : 0,
    dynamics_db: levels.length ? r(pct(levels, 0.95) - pct(levels, 0.1)) : 0,
    breathiness: hfRatios.length ? Math.round(Math.min(1, pct(hfRatios, 0.5) * 3) * 100) / 100 : 0,
    voiced_ratio: levels.length ? Math.round((pitches.length / levels.length) * 100) / 100 : 0
  };
}

/** Plain-language descriptors for the registry and prompts. */
export function describeProfile(p: VoiceProfile): Record<string, string> {
  const out: Record<string, string> = {};
  if (p.pitch_low_hz && p.pitch_high_hz && p.pitch_median_hz)
    out.range =
      hzToNote(p.pitch_low_hz) +
      '–' +
      hzToNote(p.pitch_high_hz) +
      ' (centre ' +
      hzToNote(p.pitch_median_hz) +
      ')';
  else out.range = 'not enough sustained pitched notes to measure';
  out.brightness =
    p.brightness_hz > 3000
      ? 'bright, airy top end'
      : p.brightness_hz > 1500
        ? 'balanced tone'
        : 'dark, warm tone';
  out.dynamics =
    p.dynamics_db > 20
      ? 'wide, expressive dynamics'
      : p.dynamics_db > 10
        ? 'moderate dynamics'
        : 'even, controlled delivery';
  out.breathiness =
    p.breathiness > 0.5
      ? 'noticeably breathy'
      : p.breathiness > 0.2
        ? 'slight breath texture'
        : 'clear, focused phonation';
  out.voiced_ratio = Math.round(p.voiced_ratio * 100) + '% of active frames clearly pitched';
  return out;
}
