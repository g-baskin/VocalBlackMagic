import { VocalFixError } from './errors';
import type { Probe } from './storage';

/** Explicit env path first, then whatever is on PATH (Homebrew, apt), then the Intel Homebrew default. */
function findTool(envValue: string | undefined, name: string): string {
  return envValue?.trim() || Bun.which(name) || `/usr/local/bin/${name}`;
}

export const FFMPEG = findTool(process.env.VBM_FFMPEG, 'ffmpeg');
export const FFPROBE = findTool(process.env.VBM_FFPROBE, 'ffprobe');
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const MAX_DURATION_SECONDS = 600;
export const ALLOWED_CODECS = new Set([
  'pcm_s16le',
  'pcm_s24le',
  'pcm_s32le',
  'pcm_f32le',
  'pcm_s16be',
  'pcm_u8',
  'mp3',
  'flac',
  'aac',
  'alac',
  'vorbis',
  'opus'
]);

export interface RunResult {
  code: number;
  stdout: Uint8Array;
  stderr: string;
}

/** Spawn with an argument array (never a shell), a hard timeout and an optional abort signal. */
export async function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; signal?: AbortSignal; maxStdoutBytes?: number } = {}
): Promise<RunResult> {
  if (opts.signal?.aborted) throw new VocalFixError('Cancelled.', 409);
  const proc = Bun.spawn([cmd, ...args], { stdin: 'ignore', stdout: 'pipe', stderr: 'pipe' });
  const kill = () => proc.kill('SIGKILL');
  const timer = setTimeout(kill, opts.timeoutMs ?? 120_000);
  opts.signal?.addEventListener('abort', kill, { once: true });
  try {
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
      proc.exited
    ]);
    if (opts.signal?.aborted) throw new VocalFixError('Cancelled.', 409);
    if (proc.signalCode === 'SIGKILL') throw new VocalFixError(cmd + ' timed out.', 504);
    if (opts.maxStdoutBytes && stdout.byteLength > opts.maxStdoutBytes)
      throw new VocalFixError('Decoded audio exceeds limits.', 413);
    return { code, stdout: new Uint8Array(stdout), stderr };
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', kill);
  }
}

interface FfprobeJson {
  streams?: {
    codec_type?: string;
    codec_name?: string;
    sample_rate?: string;
    channels?: number;
    duration?: string;
  }[];
  format?: { format_name?: string; duration?: string; bit_rate?: string };
}

export function parseProbe(json: string): Probe {
  let data: FfprobeJson;
  try {
    data = JSON.parse(json) as FfprobeJson;
  } catch {
    throw new VocalFixError('File is not readable audio.', 422);
  }
  const audio = data.streams?.find((s) => s.codec_type === 'audio');
  if (!audio?.codec_name) throw new VocalFixError('No audio stream found.', 422);
  const duration = Number(audio.duration ?? data.format?.duration);
  const sampleRate = Number(audio.sample_rate);
  const channels = Number(audio.channels);
  // Browser MediaRecorder WebM often has no duration header; probeAndVerify measures it by decoding.
  const knownDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192_000)
    throw new VocalFixError('Unsupported sample rate.', 422);
  if (!Number.isInteger(channels) || channels < 1 || channels > 8)
    throw new VocalFixError('Unsupported channel layout.', 422);
  const bitRate = Number(data.format?.bit_rate);
  return {
    codec: audio.codec_name,
    format: data.format?.format_name ?? 'unknown',
    duration_seconds: Math.round(knownDuration * 1000) / 1000,
    sample_rate: sampleRate,
    channels,
    bit_rate: Number.isFinite(bitRate) ? bitRate : null
  };
}

export function checkLimits(probe: Probe): void {
  if (!ALLOWED_CODECS.has(probe.codec))
    throw new VocalFixError('Unsupported audio codec: ' + probe.codec + '.', 415);
  if (probe.duration_seconds > MAX_DURATION_SECONDS)
    throw new VocalFixError('Recordings must be 10 minutes or shorter.', 413);
  if (probe.duration_seconds < 0.5)
    throw new VocalFixError('Recordings must be at least 0.5 s long.', 422);
}

/** ffprobe metadata then a full ffmpeg decode; integrity holds only if both succeed. */
export async function probeAndVerify(path: string, signal?: AbortSignal): Promise<Probe> {
  const probe = await run(
    FFPROBE,
    ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path],
    { timeoutMs: 30_000, signal }
  );
  if (probe.code !== 0) throw new VocalFixError('File is not readable audio.', 422);
  const parsed = parseProbe(new TextDecoder().decode(probe.stdout));
  if (parsed.duration_seconds === 0) {
    const pcm = await decodePcm(path, 8000, signal);
    parsed.duration_seconds = Math.round((pcm.length / 8000) * 1000) / 1000;
  }
  checkLimits(parsed);
  const decode = await run(
    FFMPEG,
    ['-nostdin', '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'],
    {
      timeoutMs: 120_000,
      signal
    }
  );
  if (decode.code !== 0 || decode.stderr.trim())
    throw new VocalFixError('Audio failed to decode cleanly.', 422);
  return parsed;
}

/** Decode to mono float32 PCM at the given rate. */
export async function decodePcm(
  path: string,
  rate: number,
  signal?: AbortSignal
): Promise<Float32Array> {
  const result = await run(
    FFMPEG,
    ['-nostdin', '-v', 'error', '-i', path, '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-'],
    { timeoutMs: 120_000, signal, maxStdoutBytes: (MAX_DURATION_SECONDS + 5) * rate * 4 }
  );
  if (result.code !== 0) throw new VocalFixError('Audio failed to decode.', 422);
  const bytes = result.stdout;
  return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4));
}

/** Run ffmpeg with an audio filter for analysis only and return stderr. */
export async function analyze(path: string, filter: string, signal?: AbortSignal): Promise<string> {
  const result = await run(
    FFMPEG,
    ['-nostdin', '-hide_banner', '-nostats', '-i', path, '-af', filter, '-f', 'null', '-'],
    { timeoutMs: 120_000, signal }
  );
  if (result.code !== 0) throw new VocalFixError('Audio analysis failed.', 422);
  return result.stderr;
}

export async function ffmpeg(
  args: string[],
  signal?: AbortSignal,
  timeoutMs = 300_000
): Promise<void> {
  const result = await run(FFMPEG, ['-nostdin', '-hide_banner', '-v', 'error', '-y', ...args], {
    timeoutMs,
    signal
  });
  if (result.code !== 0)
    throw new VocalFixError('ffmpeg failed: ' + result.stderr.trim().slice(-300), 500);
}
