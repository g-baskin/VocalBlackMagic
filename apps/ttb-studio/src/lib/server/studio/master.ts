import { ProviderError } from '../music/errors';

export const ffmpegPath = process.env.FFMPEG_PATH?.trim() || '/usr/local/bin/ffmpeg';

export interface Loudness {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
}

// Gentle tone shaping and glue compression ahead of loudness normalisation.
const toneChain = [
  'highpass=f=28',
  'equalizer=f=280:t=q:w=1.1:g=-1.5',
  'equalizer=f=3500:t=q:w=1.4:g=0.8',
  'highshelf=f=11000:g=1.2',
  'acompressor=threshold=-18dB:ratio=2:attack=25:release=250:makeup=1.5'
].join(',');
const target = 'I=-14:TP=-1:LRA=11';

export function measureArgs(input: string): string[] {
  return [
    '-hide_banner',
    '-nostdin',
    '-i',
    input,
    '-af',
    toneChain + ',loudnorm=' + target + ':print_format=json',
    '-f',
    'null',
    '-'
  ];
}

export function masterArgs(input: string, output: string, measured: Loudness): string[] {
  const loudnorm =
    'loudnorm=' +
    target +
    ':measured_I=' +
    measured.input_i +
    ':measured_TP=' +
    measured.input_tp +
    ':measured_LRA=' +
    measured.input_lra +
    ':measured_thresh=' +
    measured.input_thresh +
    ':offset=' +
    measured.target_offset +
    ':linear=true:print_format=json';
  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input,
    '-af',
    toneChain + ',' + loudnorm,
    '-ar',
    '44100',
    '-c:a',
    'pcm_s24le',
    output
  ];
}

const numeric = /^-?(?:\d+(?:\.\d+)?|inf)$/;

/** loudnorm prints its JSON report as the last {...} block on stderr. */
export function parseLoudnorm(stderr: string): Loudness & { output_i: string; output_tp: string } {
  const start = stderr.lastIndexOf('{');
  const end = stderr.lastIndexOf('}');
  if (start < 0 || end < start)
    throw new ProviderError(500, 'Mastering could not measure loudness.');
  const data = JSON.parse(stderr.slice(start, end + 1)) as Record<string, unknown>;
  const keys = [
    'input_i',
    'input_tp',
    'input_lra',
    'input_thresh',
    'target_offset',
    'output_i',
    'output_tp'
  ];
  for (const key of keys)
    if (typeof data[key] !== 'string' || !numeric.test(data[key] as string))
      throw new ProviderError(500, 'Mastering could not measure loudness (silent audio?).');
  return data as unknown as Loudness & { output_i: string; output_tp: string };
}

async function run(args: string[]): Promise<string> {
  const proc = Bun.spawn([ffmpegPath, ...args], { stdout: 'ignore', stderr: 'pipe' });
  const timer = setTimeout(() => proc.kill(), 300_000);
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  clearTimeout(timer);
  if (code !== 0) {
    console.error('ffmpeg failed:', stderr.slice(-500));
    throw new ProviderError(500, 'Mastering failed in ffmpeg.');
  }
  return stderr;
}

/** Two-pass master to -14 LUFS / -1 dBTP; writes a new 24-bit WAV and leaves the input untouched. */
export async function masterFile(input: string, output: string) {
  const measured = parseLoudnorm(await run(measureArgs(input)));
  const final = parseLoudnorm(await run(masterArgs(input, output, measured)));
  return {
    input_lufs: Number(measured.input_i),
    output_lufs: Number(final.output_i),
    output_true_peak: Number(final.output_tp)
  };
}

/** A 30 s, 128 kbps MP3 excerpt (from 0 s) used as a model reference. */
export function referenceArgs(input: string, output: string): string[] {
  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input,
    '-t',
    '30',
    '-vn',
    '-ac',
    '2',
    '-ar',
    '44100',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '128k',
    output
  ];
}

export async function makeReference(input: string, output: string): Promise<void> {
  await run(referenceArgs(input, output));
}

/** Mixes the non-vocal stems into a 30 s MP3 excerpt (an instrumental reference). */
export function instrumentalArgs(stems: string[], output: string): string[] {
  const inputs = stems.flatMap((file) => ['-i', file]);
  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    ...inputs,
    '-filter_complex',
    'amix=inputs=' + stems.length + ':normalize=0,alimiter=limit=0.95',
    '-t',
    '30',
    '-ac',
    '2',
    '-ar',
    '44100',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '128k',
    output
  ];
}

export async function makeInstrumental(stems: string[], output: string): Promise<void> {
  await run(instrumentalArgs(stems, output));
}
