/** Real audio analysis helpers. Pure except the AudioContext used for decoding. */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function decodeContext(): BaseAudioContext {
  const Ctor =
    globalThis.OfflineAudioContext ??
    (globalThis as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!Ctor) throw new Error('Audio decoding is not supported in this environment.');
  return new Ctor(1, 1, 44100);
}

export async function decodeAudioFromBlob(blob: Blob): Promise<AudioBuffer> {
  const data = await blob.arrayBuffer();
  return decodeContext().decodeAudioData(data);
}

export async function decodeAudioFromUrl(url: string, signal?: AbortSignal): Promise<AudioBuffer> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not fetch audio (HTTP ${response.status}).`);
  const data = await response.arrayBuffer();
  signal?.throwIfAborted();
  return decodeContext().decodeAudioData(data);
}

/** Mixes all channels of a buffer to mono. */
export function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const out = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < out.length; i++) out[i] += ch[i] / buffer.numberOfChannels;
  }
  return out;
}

export function computePeaks(
  channelData: Float32Array,
  buckets: number
): { min: Float32Array; max: Float32Array } {
  const n = Math.max(0, Math.floor(buckets));
  const min = new Float32Array(n);
  const max = new Float32Array(n);
  if (n === 0 || channelData.length === 0) return { min, max };
  const size = channelData.length / n;
  for (let b = 0; b < n; b++) {
    const start = Math.floor(b * size);
    const end = Math.max(start + 1, Math.min(channelData.length, Math.floor((b + 1) * size)));
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = start; i < end; i++) {
      const v = channelData[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    min[b] = lo === Infinity ? 0 : lo;
    max[b] = hi === -Infinity ? 0 : hi;
  }
  return { min, max };
}

/** In-place iterative radix-2 FFT. Length must be a power of two. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/** STFT magnitude frames in dBFS (Hann window). Each frame has fftSize/2 bins. */
export function computeSpectrogram(
  samples: Float32Array,
  sampleRate: number,
  opts: { fftSize?: number; hop?: number } = {}
): { frames: Float32Array[]; binHz: number } {
  let fftSize = opts.fftSize ?? 2048;
  fftSize = 2 ** Math.round(Math.log2(Math.max(32, fftSize)));
  const hop = Math.max(1, Math.floor(opts.hop ?? fftSize / 4));
  const binHz = sampleRate / fftSize;
  const frames: Float32Array[] = [];
  if (samples.length < fftSize) return { frames, binHz };
  const win = new Float64Array(fftSize);
  let winSum = 0;
  for (let i = 0; i < fftSize; i++) {
    win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1));
    winSum += win[i];
  }
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  const half = fftSize / 2;
  for (let start = 0; start + fftSize <= samples.length; start += hop) {
    for (let i = 0; i < fftSize; i++) {
      re[i] = samples[start + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);
    const frame = new Float32Array(half);
    for (let k = 0; k < half; k++) {
      const mag = (2 * Math.hypot(re[k], im[k])) / winSum;
      frame[k] = 20 * Math.log10(mag + 1e-10);
    }
    frames.push(frame);
  }
  return { frames, binHz };
}

/** YIN pitch tracker. hz[i] = 0 marks unvoiced frames. */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  opts: { frame?: number; hop?: number; minHz?: number; maxHz?: number } = {}
): { times: Float32Array; hz: Float32Array } {
  const frame = Math.max(64, Math.floor(opts.frame ?? 2048));
  const hop = Math.max(1, Math.floor(opts.hop ?? 512));
  const minHz = opts.minHz ?? 60;
  const maxHz = opts.maxHz ?? 1200;
  const half = Math.floor(frame / 2);
  const maxLag = Math.min(half - 1, Math.floor(sampleRate / minHz));
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const count = samples.length >= frame ? Math.floor((samples.length - frame) / hop) + 1 : 0;
  const times = new Float32Array(count);
  const hz = new Float32Array(count);
  const diff = new Float64Array(maxLag + 2);
  const threshold = 0.15;
  for (let f = 0; f < count; f++) {
    const start = f * hop;
    times[f] = (start + frame / 2) / sampleRate;
    let energy = 0;
    for (let i = 0; i < frame; i++) energy += samples[start + i] ** 2;
    if (Math.sqrt(energy / frame) < 0.01) continue;
    for (let tau = 1; tau <= maxLag + 1; tau++) {
      let sum = 0;
      for (let i = 0; i < half; i++) {
        const d = samples[start + i] - samples[start + i + tau];
        sum += d * d;
      }
      diff[tau] = sum;
    }
    // cumulative mean normalised difference
    let running = 0;
    diff[0] = 1;
    for (let tau = 1; tau <= maxLag + 1; tau++) {
      running += diff[tau];
      diff[tau] = running === 0 ? 1 : (diff[tau] * tau) / running;
    }
    let lag = -1;
    for (let tau = minLag; tau <= maxLag; tau++) {
      if (diff[tau] < threshold) {
        while (tau + 1 <= maxLag && diff[tau + 1] < diff[tau]) tau++;
        lag = tau;
        break;
      }
    }
    if (lag < 0) continue;
    const a = diff[lag - 1];
    const b = diff[lag];
    const c = diff[lag + 1];
    const denom = a - 2 * b + c;
    const refined = denom !== 0 ? lag + (a - c) / (2 * denom) : lag;
    const value = sampleRate / refined;
    if (value >= minHz && value <= maxHz) hz[f] = value;
  }
  return { times, hz };
}

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function hzToNote(hz: number): string {
  if (!Number.isFinite(hz) || hz <= 0) return '—';
  const midi = Math.round(hzToMidi(hz));
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** RMS level in dBFS (-Infinity for digital silence). */
export function rmsDbfs(samples: Float32Array): number {
  if (samples.length === 0) return -Infinity;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  const rms = Math.sqrt(sum / samples.length);
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/** Normalised 12-bin pitch-class histogram (C=0 … B=11) of voiced frames; all zeros if unvoiced. */
export function pitchClassHistogram(hz: Float32Array): Float32Array {
  const bins = new Float32Array(12);
  let total = 0;
  for (const v of hz) {
    if (v <= 0) continue;
    const pc = ((Math.round(hzToMidi(v)) % 12) + 12) % 12;
    bins[pc] += 1;
    total += 1;
  }
  if (total > 0) for (let i = 0; i < 12; i++) bins[i] /= total;
  return bins;
}

/** RMS envelope over `buckets` equal slices, normalised to a peak of 1. */
export function energyEnvelope(samples: Float32Array, buckets: number): Float32Array {
  const n = Math.max(0, Math.floor(buckets));
  const out = new Float32Array(n);
  if (n === 0 || samples.length === 0) return out;
  const size = samples.length / n;
  let peak = 0;
  for (let b = 0; b < n; b++) {
    const start = Math.floor(b * size);
    const end = Math.max(start + 1, Math.min(samples.length, Math.floor((b + 1) * size)));
    let sum = 0;
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    out[b] = Math.sqrt(sum / (end - start));
    if (out[b] > peak) peak = out[b];
  }
  if (peak > 0) for (let b = 0; b < n; b++) out[b] /= peak;
  return out;
}

/** Mean spectral centroid in Hz across STFT frames (power-weighted); 0 for silence. */
export function spectralCentroid(samples: Float32Array, sampleRate: number): number {
  const { frames, binHz } = computeSpectrogram(samples, sampleRate, { fftSize: 2048, hop: 4096 });
  let num = 0;
  let den = 0;
  for (const f of frames) {
    for (let k = 1; k < f.length; k++) {
      const p = 10 ** (f[k] / 10);
      num += p * k * binHz;
      den += p;
    }
  }
  return den > 1e-12 ? num / den : 0;
}
