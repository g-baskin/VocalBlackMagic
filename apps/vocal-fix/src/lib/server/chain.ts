import type { Diagnosis } from './diagnose';

export const presetIds = ['natural', 'radio', 'ethereal', 'grit'] as const;
export type PresetId = (typeof presetIds)[number];

export interface Preset {
  id: PresetId;
  name: string;
  description: string;
  highpass_hz: number;
  denoise_nr: number;
  deess: number;
  compressor: {
    threshold_db: number;
    ratio: number;
    attack_ms: number;
    release_ms: number;
    makeup: number;
  };
  eq: { f: number; g: number; w: number }[];
  extra: string[];
  target_lufs: number;
}

export const presets: Record<PresetId, Preset> = {
  natural: {
    id: 'natural',
    name: 'Natural',
    description: 'Transparent cleanup: rumble cut, gentle denoise and light levelling.',
    highpass_hz: 80,
    denoise_nr: 8,
    deess: 0.3,
    compressor: { threshold_db: -20, ratio: 2, attack_ms: 15, release_ms: 150, makeup: 1.5 },
    eq: [{ f: 250, g: -1.5, w: 1 }],
    extra: [],
    target_lufs: -18
  },
  radio: {
    id: 'radio',
    name: 'Radio Presence',
    description: 'Forward, intimate and tight: presence lift and firmer compression.',
    highpass_hz: 100,
    denoise_nr: 10,
    deess: 0.5,
    compressor: { threshold_db: -24, ratio: 4, attack_ms: 8, release_ms: 120, makeup: 3 },
    eq: [
      { f: 300, g: -2.5, w: 1 },
      { f: 3200, g: 3, w: 1.2 },
      { f: 120, g: 1.5, w: 0.8 }
    ],
    extra: [],
    target_lufs: -16
  },
  ethereal: {
    id: 'ethereal',
    name: 'Ethereal Air',
    description: 'Lifted air band and a soft airy tail for a floating vocal.',
    highpass_hz: 120,
    denoise_nr: 12,
    deess: 0.6,
    compressor: { threshold_db: -22, ratio: 2.5, attack_ms: 20, release_ms: 250, makeup: 2 },
    eq: [
      { f: 400, g: -2, w: 1 },
      { f: 10000, g: 4, w: 1.5 }
    ],
    extra: ['aecho=0.8:0.5:60|120:0.18|0.10'],
    target_lufs: -18
  },
  grit: {
    id: 'grit',
    name: 'Raw Grit',
    description: 'Keeps the room, adds mid bite and soft saturation; loose dynamics.',
    highpass_hz: 70,
    denoise_nr: 4,
    deess: 0.2,
    compressor: { threshold_db: -18, ratio: 3, attack_ms: 5, release_ms: 80, makeup: 2 },
    eq: [{ f: 1800, g: 3, w: 1 }],
    extra: ['asoftclip=type=tanh:threshold=0.8'],
    target_lufs: -16
  }
};

export function isPresetId(value: unknown): value is PresetId {
  return typeof value === 'string' && (presetIds as readonly string[]).includes(value);
}

export const MAX_MAKEUP_DB = 12;
export const STRONGER_MAX_MAKEUP_DB = 6;

const linear = (db: number) => Math.pow(10, db / 20).toFixed(5);

/**
 * Pass 1 of the polish: repair and shape, with no loudness normalisation.
 * Denoise strength and the between-phrase gate follow the diagnosed noise floor;
 * strength 1 is the stronger retry used by the never-worse guard.
 */
export function buildPolishChain(
  id: PresetId,
  diagnosis?: Pick<Diagnosis, 'clipped_samples' | 'noise_floor_db'>,
  strength: 0 | 1 = 0
): string {
  const p = presets[id];
  const filters: string[] = [];
  if (diagnosis && diagnosis.clipped_samples > 0) filters.push('adeclip');
  filters.push('highpass=f=' + p.highpass_hz);
  const floor = diagnosis ? Math.min(-20, Math.max(-80, diagnosis.noise_floor_db)) : -50;
  const noisy = floor > -50;
  const nr = Math.min(40, p.denoise_nr + (noisy ? 12 : 0) + strength * 6);
  // tn=1 tracks the noise profile through the take, so the quiet gaps teach the denoiser.
  filters.push('afftdn=nr=' + nr + ':nf=' + Math.round(floor) + (noisy ? ':tn=1' : ''));
  if (noisy)
    filters.push(
      'agate=threshold=' +
        linear(floor + 5 + strength * 2) +
        ':ratio=8:range=' +
        (strength ? '0.05' : '0.1') +
        ':attack=5:release=300'
    );
  filters.push('deesser=i=' + p.deess);
  const c = p.compressor;
  filters.push(
    'acompressor=threshold=' +
      c.threshold_db +
      'dB:ratio=' +
      c.ratio +
      ':attack=' +
      c.attack_ms +
      ':release=' +
      c.release_ms +
      ':makeup=' +
      c.makeup
  );
  for (const band of p.eq)
    filters.push('equalizer=f=' + band.f + ':t=q:w=' + band.w + ':g=' + band.g);
  filters.push(...p.extra);
  return filters.join(',');
}

/** Pass 2: static gain toward the preset target, make-up capped so the floor is not dragged up. */
export function loudnessGainDb(
  measuredLufs: number | null,
  id: PresetId,
  strength: 0 | 1 = 0
): number {
  if (measuredLufs === null) return 0;
  const cap = strength ? STRONGER_MAX_MAKEUP_DB : MAX_MAKEUP_DB;
  return Math.round(Math.min(cap, presets[id].target_lufs - measuredLufs) * 100) / 100;
}

export function gainArgs(input: string, output: string, gainDb: number): string[] {
  return [
    '-i',
    input,
    '-af',
    'volume=' + gainDb + 'dB,alimiter=limit=0.84:level=false',
    '-ar',
    '48000',
    '-c:a',
    'pcm_s24le',
    output
  ];
}

export const GUARDED_SCORES = ['noise', 'clipping', 'overall'] as const;
export type GuardedScore = (typeof GUARDED_SCORES)[number];

/** Key scores that dropped by more than 5 points after repair. */
export function regressions(
  before: Record<GuardedScore, number> | undefined,
  after: Record<GuardedScore, number>
): GuardedScore[] {
  if (!before) return [];
  return GUARDED_SCORES.filter((k) => after[k] < before[k] - 0.05);
}

export function regressionFinding(k: GuardedScore): string {
  return k === 'noise'
    ? 'Local polish could not remove this noise; try AI enhance.'
    : k === 'clipping'
      ? 'Local polish could not repair this clipping; try AI enhance or a cleaner take.'
      : 'Local polish made this take worse overall; try AI enhance or keep the original.';
}

/** ffmpeg args rendering a derived 48 kHz / 24-bit WAV; input is never modified. */
export function polishArgs(input: string, output: string, chain: string): string[] {
  return ['-i', input, '-af', chain, '-c:a', 'pcm_f32le', output];
}
