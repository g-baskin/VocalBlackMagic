import { computePeaks, computeSpectrogram, spectralCentroid } from '@vbm/ui/audio';
import { maxSoundSeconds, type SoundFeatures } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { ffmpegPath } from '../studio/master';

export const analysisRate = 22050;
const timeoutMs = 120_000;

/** Runs ffmpeg with argument arrays only; returns stderr, throws a plain 422/500 on failure. */
export async function ffmpeg(args: string[], failure: string): Promise<string> {
  const proc = Bun.spawn([ffmpegPath, ...args], { stdout: 'ignore', stderr: 'pipe' });
  const timer = setTimeout(() => proc.kill(), timeoutMs);
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  clearTimeout(timer);
  if (code !== 0) {
    console.error('ffmpeg failed:', stderr.slice(-500));
    throw new ProviderError(422, failure);
  }
  return stderr;
}

/** Full decode to mono float PCM; -xerror makes a corrupt stream fail instead of being skipped. */
export function decodeArgs(input: string): string[] {
  return [
    '-hide_banner',
    '-nostdin',
    '-v',
    'error',
    '-xerror',
    '-i',
    input,
    '-vn',
    '-ac',
    '1',
    '-ar',
    String(analysisRate),
    '-f',
    'f32le',
    'pipe:1'
  ];
}

/** Decodes the whole file; refuses anything longer than maxSeconds without buffering it. */
export async function decodeMono(
  input: string,
  maxSeconds = maxSoundSeconds
): Promise<Float32Array> {
  const limit = Math.ceil((maxSeconds + 0.05) * analysisRate) * 4;
  const proc = Bun.spawn([ffmpegPath, ...decodeArgs(input)], { stdout: 'pipe', stderr: 'pipe' });
  const timer = setTimeout(() => proc.kill(), timeoutMs);
  const errText = new Response(proc.stderr).text();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let tooLong = false;
  const reader = proc.stdout.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      tooLong = true;
      proc.kill();
      await reader.cancel().catch(() => undefined);
      break;
    }
    chunks.push(value);
  }
  const code = await proc.exited;
  clearTimeout(timer);
  const stderr = await errText;
  if (tooLong)
    throw new ProviderError(422, 'Sounds can be at most ' + maxSoundSeconds + ' seconds long.');
  if (code !== 0) {
    console.error('ffmpeg decode failed:', stderr.slice(-500));
    throw new ProviderError(422, 'The file could not be decoded as audio.');
  }
  const bytes = new Uint8Array(size - (size % 4));
  let offset = 0;
  for (const chunk of chunks) {
    const take = Math.min(chunk.length, bytes.length - offset);
    bytes.set(chunk.subarray(0, take), offset);
    offset += take;
  }
  return new Float32Array(bytes.buffer);
}

/** The playable copy: 44.1 kHz stereo 16-bit WAV. */
export function playableArgs(input: string, output: string): string[] {
  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input,
    '-vn',
    '-map_metadata',
    '-1',
    '-ac',
    '2',
    '-ar',
    '44100',
    '-c:a',
    'pcm_s16le',
    output
  ];
}

const db = (v: number) => (v > 1e-9 ? 20 * Math.log10(v) : -180);
const round = (v: number, places = 2) => Math.round(v * 10 ** places) / 10 ** places;

/** Start of the loudest 10 ms window, in seconds (5 ms hop). */
export function hitPoint(samples: Float32Array, rate = analysisRate): number {
  const win = Math.max(1, Math.round(rate * 0.01));
  const hop = Math.max(1, Math.round(rate * 0.005));
  let best = 0;
  let bestAt = 0;
  for (let start = 0; start + win <= samples.length; start += hop) {
    let sum = 0;
    for (let i = start; i < start + win; i++) sum += samples[i] * samples[i];
    if (sum > best) {
      best = sum;
      bestAt = start;
    }
  }
  return round(bestAt / rate, 4);
}

/** Short sounds are zero-padded (centred) to one analysis frame so they still get spectra. */
export function centred(samples: Float32Array, length: number): Float32Array {
  if (samples.length >= length) return samples;
  const out = new Float32Array(length);
  out.set(samples, Math.floor((length - samples.length) / 2));
  return out;
}

/** Mean spectral flatness (geometric / arithmetic mean of power) over frames that carry energy. */
export function flatness(samples: Float32Array, rate = analysisRate): number {
  const { frames } = computeSpectrogram(centred(samples, 1024), rate, { fftSize: 1024, hop: 2048 });
  let total = 0;
  let counted = 0;
  for (const frame of frames) {
    let logSum = 0;
    let sum = 0;
    for (let k = 1; k < frame.length; k++) {
      const p = 10 ** (frame[k] / 10);
      logSum += Math.log(p);
      sum += p;
    }
    const n = frame.length - 1;
    const mean = sum / n;
    if (mean < 1e-9) continue;
    total += Math.exp(logSum / n) / mean;
    counted += 1;
  }
  return counted ? round(total / counted, 3) : 0;
}

export function analyse(samples: Float32Array, rate = analysisRate) {
  let peak = 0;
  let energy = 0;
  for (const s of samples) {
    const a = Math.abs(s);
    if (a > peak) peak = a;
    energy += s * s;
  }
  const rms = samples.length ? Math.sqrt(energy / samples.length) : 0;
  const { min, max } = computePeaks(samples, 48);
  const heights = Array.from(max, (hi, i) => Math.max(hi, -min[i]));
  const top = Math.max(...heights, 1e-9);
  const features: SoundFeatures = {
    peak_db: round(db(peak)),
    rms_db: round(db(rms)),
    crest_db: round(db(peak) - db(rms)),
    centroid_hz: Math.round(spectralCentroid(centred(samples, 2048), rate)),
    flatness: flatness(samples, rate),
    thumb: heights.map((h) => round(h / top, 3))
  };
  return {
    duration_seconds: round(samples.length / rate, 4),
    hit_seconds: hitPoint(samples, rate),
    features
  };
}

/** Plain descriptive tags from measured features (matches the browser's filter words). */
export function autoTags(f: SoundFeatures): string[] {
  const tags: string[] = [];
  if (f.centroid_hz < 1200) tags.push('dark');
  else if (f.centroid_hz > 3000) tags.push('bright');
  if (f.centroid_hz > 4500) tags.push('airy');
  if (f.flatness > 0.3) tags.push('noisy');
  else if (f.flatness < 0.08) tags.push('tonal');
  if (f.rms_db < -24) tags.push('soft');
  else if (f.rms_db > -12) tags.push('huge');
  return tags;
}
