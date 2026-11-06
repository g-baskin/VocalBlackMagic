import { analyze, decodePcm } from './media';

export const ANALYSIS_RATE = 44_100;
const FRAME_SECONDS = 0.05;
const CLIP_LEVEL = 0.989;

export interface Region {
  start: number;
  end: number;
  label: string;
}

export interface Loudness {
  integrated_lufs: number | null;
  range_lu: number | null;
  true_peak_dbtp: number | null;
}

export interface Stats {
  peak_db: number | null;
  rms_db: number | null;
  dc_offset: number | null;
  crest_db: number | null;
}

export interface FrameStats {
  noise_floor_db: number;
  signal_db: number;
  snr_db: number;
  clipped_samples: number;
  clip_regions: Region[];
}

export interface Diagnosis {
  analyzed_at: string;
  duration_seconds: number;
  loudness: Loudness;
  stats: Stats;
  noise_floor_db: number;
  snr_db: number;
  clipped_samples: number;
  silence_ratio: number;
  silences: { start: number; end: number }[];
  scores: { loudness: number; clipping: number; noise: number; dynamics: number; overall: number };
  findings: { severity: 'info' | 'warning' | 'problem'; text: string; region?: Region }[];
  regions: Region[];
}

const num = (s: string | undefined): number | null => {
  if (s === undefined) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
};

export function parseEbur128(stderr: string): Loudness {
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  return {
    integrated_lufs: num(/I:\s+(-?[\d.]+|-inf)\s+LUFS/.exec(summary)?.[1]),
    range_lu: num(/LRA:\s+(-?[\d.]+)\s+LU/.exec(summary)?.[1]),
    true_peak_dbtp: num(/Peak:\s+(-?[\d.]+|-inf)\s+dBFS/.exec(summary)?.[1])
  };
}

export function parseAstats(stderr: string): Stats {
  const overall = stderr.slice(stderr.lastIndexOf('Overall'));
  const pick = (label: string) => num(new RegExp(label + ':\\s*(-?[\\d.e+-]+)').exec(overall)?.[1]);
  return {
    peak_db: pick('Peak level dB'),
    rms_db: pick('RMS level dB'),
    dc_offset: pick('DC offset'),
    crest_db: (() => {
      const peak = pick('Peak level dB');
      const rms = pick('RMS level dB');
      return peak !== null && rms !== null ? Math.round((peak - rms) * 10) / 10 : null;
    })()
  };
}

export function parseSilences(stderr: string, duration: number): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let open: number | null = null;
  for (const line of stderr.split('\n')) {
    const s = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (s) open = Math.max(0, Number(s[1]));
    const e = /silence_end:\s*([\d.]+)/.exec(line);
    if (e && open !== null) {
      out.push({ start: open, end: Number(e[1]) });
      open = null;
    }
  }
  if (open !== null) out.push({ start: open, end: duration });
  return out;
}

/** Frame RMS percentiles (noise floor vs. active signal) and clipped-sample runs. */
export function frameStats(pcm: Float32Array, rate: number): FrameStats {
  const frame = Math.max(1, Math.round(rate * FRAME_SECONDS));
  const levels: number[] = [];
  for (let i = 0; i + frame <= pcm.length; i += frame) {
    let sum = 0;
    for (let j = i; j < i + frame; j++) sum += pcm[j] * pcm[j];
    const rms = Math.sqrt(sum / frame);
    levels.push(rms > 0 ? 20 * Math.log10(rms) : -120);
  }
  levels.sort((a, b) => a - b);
  const pct = (p: number) =>
    levels.length ? levels[Math.min(levels.length - 1, Math.floor(p * levels.length))] : -120;
  const noise = Math.max(-120, pct(0.1));
  const signal = pct(0.95);
  const clipRegions: Region[] = [];
  let clipped = 0;
  let run = 0;
  for (let i = 0; i <= pcm.length; i++) {
    if (i < pcm.length && Math.abs(pcm[i]) >= CLIP_LEVEL) {
      run++;
      continue;
    }
    if (run >= 3) {
      clipped += run;
      const start = (i - run) / rate;
      const end = i / rate;
      const last = clipRegions.at(-1);
      if (last && start - last.end < 0.25) last.end = end;
      else clipRegions.push({ start, end, label: 'clipping' });
    }
    run = 0;
  }
  return {
    noise_floor_db: Math.round(noise * 10) / 10,
    signal_db: Math.round(signal * 10) / 10,
    snr_db: Math.round((signal - noise) * 10) / 10,
    clipped_samples: clipped,
    clip_regions: clipRegions
  };
}

export const timecode = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const round2 = (x: number) => Math.round(x * 100) / 100;

export function buildDiagnosis(
  duration: number,
  loudness: Loudness,
  stats: Stats,
  frames: FrameStats,
  silences: { start: number; end: number }[],
  now: Date
): Diagnosis {
  const silent = silences.reduce((t, s) => t + (s.end - s.start), 0);
  const silenceRatio = duration > 0 ? clamp01(silent / duration) : 0;
  const lufs = loudness.integrated_lufs;
  const loudScore = lufs === null ? 0 : clamp01(1 - Math.abs(lufs - -16) / 20);
  const clipRatio = frames.clipped_samples / Math.max(1, duration * ANALYSIS_RATE);
  const clipScore = frames.clipped_samples === 0 ? 1 : clamp01(1 - Math.sqrt(clipRatio) * 10);
  const noiseScore = clamp01((frames.snr_db - 15) / 35);
  const crestDb = stats.crest_db ?? 0;
  const dynScore = clamp01(1 - Math.abs(crestDb - 15) / 15);
  const overall = clamp01(0.25 * loudScore + 0.3 * clipScore + 0.3 * noiseScore + 0.15 * dynScore);
  const findings: Diagnosis['findings'] = [];
  for (const r of frames.clip_regions.slice(0, 12))
    findings.push({ severity: 'problem', text: 'Clipping at ' + timecode(r.start), region: r });
  if (frames.clip_regions.length > 12)
    findings.push({
      severity: 'problem',
      text: frames.clip_regions.length - 12 + ' more clipped spots'
    });
  if (frames.noise_floor_db > -60)
    findings.push({
      severity: frames.noise_floor_db > -45 ? 'problem' : 'warning',
      text:
        'Room noise ' +
        Math.round(frames.noise_floor_db) +
        ' dB (SNR ' +
        Math.round(frames.snr_db) +
        ' dB)'
    });
  else
    findings.push({
      severity: 'info',
      text: 'Quiet noise floor ' + Math.round(frames.noise_floor_db) + ' dB'
    });
  if (lufs === null)
    findings.push({ severity: 'problem', text: 'No measurable loudness (silent take?)' });
  else if (lufs < -28)
    findings.push({ severity: 'warning', text: 'Very quiet take: ' + lufs.toFixed(1) + ' LUFS' });
  else if (lufs > -9)
    findings.push({ severity: 'warning', text: 'Very loud take: ' + lufs.toFixed(1) + ' LUFS' });
  else findings.push({ severity: 'info', text: 'Loudness ' + lufs.toFixed(1) + ' LUFS' });
  if (stats.dc_offset !== null && Math.abs(stats.dc_offset) > 0.01)
    findings.push({ severity: 'warning', text: 'DC offset ' + stats.dc_offset.toFixed(3) });
  if (silenceRatio > 0.5)
    findings.push({
      severity: 'warning',
      text: Math.round(silenceRatio * 100) + '% of the take is silence'
    });
  const longSilences = silences.filter((s) => s.end - s.start >= 2);
  const regions: Region[] = [
    ...frames.clip_regions,
    ...longSilences.map((s) => ({ start: s.start, end: s.end, label: 'silence' }))
  ].sort((a, b) => a.start - b.start);
  return {
    analyzed_at: now.toISOString(),
    duration_seconds: duration,
    loudness,
    stats,
    noise_floor_db: frames.noise_floor_db,
    snr_db: frames.snr_db,
    clipped_samples: frames.clipped_samples,
    silence_ratio: round2(silenceRatio),
    silences,
    scores: {
      loudness: round2(loudScore),
      clipping: round2(clipScore),
      noise: round2(noiseScore),
      dynamics: round2(dynScore),
      overall: round2(overall)
    },
    findings,
    regions
  };
}

export const SILENCE_FILTER = 'silencedetect=noise=-40dB:d=0.35';

export async function diagnoseFile(
  path: string,
  duration: number,
  now: Date,
  signal?: AbortSignal
): Promise<Diagnosis> {
  const [ebu, astats, silence, pcm] = await Promise.all([
    analyze(path, 'ebur128=peak=true', signal),
    analyze(path, 'astats=measure_perchannel=none', signal),
    analyze(path, SILENCE_FILTER, signal),
    decodePcm(path, ANALYSIS_RATE, signal)
  ]);
  return buildDiagnosis(
    duration,
    parseEbur128(ebu),
    parseAstats(astats),
    frameStats(pcm, ANALYSIS_RATE),
    parseSilences(silence, duration),
    now
  );
}
