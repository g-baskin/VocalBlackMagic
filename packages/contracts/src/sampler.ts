import { stemNames, type StemName, type StoredAudio } from './studio';

/* ---- Pads: the TTB Studio sampler. Sounds live in a library; kits map them onto 36 pads. ---- */

export const soundCategories = [
  'ambience',
  'bass',
  'drum',
  'glitch',
  'impact',
  'keys',
  'pad',
  'pluck',
  'synth',
  'transition',
  'vocal'
] as const;
export type SoundCategory = (typeof soundCategories)[number];

/** Measured from the decoded audio when the sound is stored. */
export interface SoundFeatures {
  peak_db: number;
  rms_db: number;
  crest_db: number;
  /** Mean spectral centroid in Hz. */
  centroid_hz: number;
  /** Spectral flatness 0 (tonal) to 1 (noise). */
  flatness: number;
  /** 48 normalised peak heights for list thumbnails. */
  thumb: number[];
}

/** Where a sound came from; every kind keeps what its rights depend on. */
export type SoundSource =
  | {
      kind: 'slice';
      song_id: string;
      song_title: string;
      stem: 'main' | StemName;
      start_seconds: number;
      end_seconds: number;
      /** The song's runner licence, or null when the song predates runner records. */
      license: string | null;
      commercial: boolean | null;
    }
  | {
      kind: 'gold';
      voice_id: string;
      performer: string;
      consent_ref: string;
      start_seconds: number;
      end_seconds: number;
    }
  | {
      kind: 'upload';
      sha256: string;
      original_name: string;
      attested_name: string;
      attested_at: string;
    }
  | { kind: 'pack'; pack: string; license: 'CC0-1.0'; url: string }
  | { kind: 'ai'; provider: 'elevenlabs'; model: string; prompt: string; est_cost_usd: number };
export type SoundSourceKind = SoundSource['kind'];

export interface SoundMeta {
  id: string;
  name: string;
  category: SoundCategory;
  tags: string[];
  favourite: boolean;
  created_at: string;
  duration_seconds: number;
  /** Loudest 10 ms window: the point "Lands on" puts on the grid. */
  hit_seconds: number;
  features: SoundFeatures;
  /** Playable 44.1 kHz WAV. */
  audio: StoredAudio;
  /** The bytes exactly as received, kept unmodified. */
  original: StoredAudio;
  source: SoundSource;
}

export const maxSoundSeconds = 30;
export const maxUploadBytes = 20 * 1024 * 1024;
export const maxSlicesPerRequest = 64;

/* ---- Kits ---- */

export const kitSchema = 1;
export const padCount = 36;
/** C1 in the C3 = 60 convention used by most samplers and DAWs. */
export const firstPadNote = 36;
export const layerCount = 3;
export const macroCount = 8;
export const modSlotCount = 16;

export const launchGrids = [
  'natural',
  '1/8',
  '1/4',
  '1/2',
  '1 bar',
  '2 bars',
  '4 bars',
  '8 bars'
] as const;
export type LaunchGrid = (typeof launchGrids)[number];
export const launchModes = ['one-shot', 'gate', 'loop'] as const;
export type LaunchMode = (typeof launchModes)[number];

export const syncRates = ['1/16', '1/8', '1/4', '1/2', '1 bar', '2 bars', '4 bars'] as const;
export type SyncRate = (typeof syncRates)[number];
export const lfoShapes = ['sine', 'triangle', 'saw', 'square', 'random'] as const;
export type LfoShape = (typeof lfoShapes)[number];

export const macroNames = [
  'Darken',
  'Grain',
  'Space',
  'Echo',
  'Drive',
  'Weight',
  'Air',
  'Swell'
] as const;

export interface PadLaunch {
  lands_on: LaunchGrid;
  mode: LaunchMode;
  sync: boolean;
  reverse: boolean;
}

export interface Pad {
  note: number;
  /** Sound id per layer (L1, L2, L3) or null. */
  layers: (string | null)[];
  launch: PadLaunch;
}

export interface LayerParams {
  tone: {
    level_db: number;
    pan: number;
    cutoff_hz: number;
    reso: number;
    attack_ms: number;
    release_ms: number;
  };
  grain: {
    mix: number;
    position: number;
    size_ms: number;
    density: number;
    spray: number;
    jitter: number;
    reverse: number;
    freeze: boolean;
  };
  motion: { lfo1_rate: SyncRate; lfo1_shape: LfoShape; lfo2_rate: SyncRate; lfo2_shape: LfoShape };
}

export interface WholeKitParams {
  pitch_st: number;
  /** How much velocity changes loudness, 0 to 100. */
  velocity: number;
  attack_ms: number;
  release_ms: number;
  cutoff_hz: number;
  reso: number;
}

const layerParamNames = [
  'level',
  'pan',
  'cutoff',
  'reso',
  'attack',
  'release',
  'grain_mix',
  'grain_position',
  'grain_size',
  'grain_density'
] as const;
const fxParamNames = [
  'delay_mix',
  'delay_feedback',
  'reverb_mix',
  'reverb_size',
  'drive',
  'eq_low',
  'eq_mid',
  'eq_high',
  'volume'
] as const;

export const modSources = [
  'none',
  ...Array.from({ length: macroCount }, (_, i) => 'macro' + (i + 1)),
  ...[1, 2, 3].flatMap((l) => ['l' + l + '_lfo1', 'l' + l + '_lfo2']),
  'velocity'
];
export const modDestinations = [
  'none',
  ...layerParamNames.map((p) => 'all_' + p),
  ...[1, 2, 3].flatMap((l) => layerParamNames.map((p) => 'l' + l + '_' + p)),
  ...fxParamNames
];

export interface ModSlot {
  source: string;
  destination: string;
  /** Bipolar, -1 to 1. */
  amount: number;
}

export interface KitFx {
  delay_time: SyncRate;
  delay_feedback: number;
  delay_mix: number;
  reverb_size: number;
  reverb_mix: number;
  eq_low_db: number;
  eq_mid_db: number;
  eq_mid_hz: number;
  eq_high_db: number;
  drive_db: number;
  volume_db: number;
  ceiling_db: number;
  soft_clip: boolean;
}

export interface Kit {
  schema: typeof kitSchema;
  id: string;
  name: string;
  bpm: number;
  created_at: string;
  updated_at: string;
  pads: Pad[];
  /** 0 to 1 each. */
  macros: number[];
  whole: WholeKitParams;
  layers: LayerParams[];
  mod: ModSlot[];
  fx: KitFx;
}

export interface KitSummary {
  id: string;
  name: string;
  bpm: number;
  updated_at: string;
  pads_used: number;
}

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
/** MIDI note name in the C3 = 60 convention (36 is C1). */
export function padNoteName(note: number): string {
  return noteNames[((note % 12) + 12) % 12] + (Math.floor(note / 12) - 2);
}

export function defaultLayer(): LayerParams {
  return {
    tone: { level_db: 0, pan: 0, cutoff_hz: 20000, reso: 0.71, attack_ms: 0, release_ms: 0 },
    grain: {
      mix: 0,
      position: 0,
      size_ms: 80,
      density: 20,
      spray: 0.1,
      jitter: 0,
      reverse: 0,
      freeze: false
    },
    motion: { lfo1_rate: '1/4', lfo1_shape: 'sine', lfo2_rate: '1/4', lfo2_shape: 'sine' }
  };
}

/** Rows 1 to 8 match the macro knobs by default; the rest are empty. */
export function defaultModMatrix(): ModSlot[] {
  const preset: [string, number][] = [
    ['all_cutoff', -0.6],
    ['all_grain_mix', 1],
    ['reverb_mix', 0.6],
    ['delay_mix', 0.5],
    ['drive', 0.5],
    ['eq_low', 0.5],
    ['eq_high', 0.5],
    ['all_attack', 0.25]
  ];
  return Array.from({ length: modSlotCount }, (_, i) =>
    i < preset.length
      ? { source: 'macro' + (i + 1), destination: preset[i][0], amount: preset[i][1] }
      : { source: 'none', destination: 'none', amount: 0 }
  );
}

export function newKit(id: string, name: string, now: string): Kit {
  return {
    schema: kitSchema,
    id,
    name,
    bpm: 120,
    created_at: now,
    updated_at: now,
    pads: Array.from({ length: padCount }, (_, i) => ({
      note: firstPadNote + i,
      layers: [null, null, null],
      launch: { lands_on: '1 bar', mode: 'one-shot', sync: true, reverse: false }
    })),
    macros: Array.from({ length: macroCount }, () => 0),
    whole: {
      pitch_st: 0,
      velocity: 50,
      attack_ms: 0,
      release_ms: 300,
      cutoff_hz: 20000,
      reso: 0.71
    },
    layers: Array.from({ length: layerCount }, defaultLayer),
    mod: defaultModMatrix(),
    fx: {
      delay_time: '1/8',
      delay_feedback: 0.48,
      delay_mix: 0,
      reverb_size: 0.78,
      reverb_mix: 0,
      eq_low_db: 0,
      eq_mid_db: 0,
      eq_mid_hz: 1000,
      eq_high_db: 0,
      drive_db: 0,
      volume_db: 0,
      ceiling_db: -0.3,
      soft_clip: true
    }
  };
}

/* ---- Validation (shared by UI and server; ranges are refused, never silently clamped) ---- */

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function isSoundId(id: unknown): id is string {
  return typeof id === 'string' && uuidPattern.test(id);
}
export const isKitId = isSoundId;

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const inRange = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const oneOf = (v: unknown, list: readonly string[]) => typeof v === 'string' && list.includes(v);

type Ranges = Record<string, [number, number]>;
function checkRanges(obj: unknown, ranges: Ranges, where: string): string | null {
  if (!isObject(obj)) return where + ' is missing.';
  for (const [key, [lo, hi]] of Object.entries(ranges))
    if (!inRange(obj[key], lo, hi)) return where + '.' + key + ' must be ' + lo + ' to ' + hi + '.';
  return null;
}

const toneRanges: Ranges = {
  level_db: [-60, 12],
  pan: [-1, 1],
  cutoff_hz: [20, 20000],
  reso: [0.1, 20],
  attack_ms: [0, 5000],
  release_ms: [0, 10000]
};
const grainRanges: Ranges = {
  mix: [0, 100],
  position: [0, 100],
  size_ms: [5, 500],
  density: [1, 100],
  spray: [0, 1],
  jitter: [0, 100],
  reverse: [0, 100]
};
const wholeRanges: Ranges = {
  pitch_st: [-24, 24],
  velocity: [0, 100],
  attack_ms: [0, 5000],
  release_ms: [0, 10000],
  cutoff_hz: [20, 20000],
  reso: [0.1, 20]
};
const fxRanges: Ranges = {
  delay_feedback: [0, 0.95],
  delay_mix: [0, 1],
  reverb_size: [0, 1],
  reverb_mix: [0, 1],
  eq_low_db: [-24, 24],
  eq_mid_db: [-24, 24],
  eq_mid_hz: [100, 10000],
  eq_high_db: [-24, 24],
  drive_db: [0, 36],
  volume_db: [-60, 12],
  ceiling_db: [-12, 0]
};

export function validateKit(value: unknown): string | null {
  if (!isObject(value)) return 'Kit must be a JSON object.';
  const k = value;
  if (k.schema !== kitSchema) return 'Unknown kit schema version; this studio reads version 1.';
  if (!isKitId(k.id)) return 'Kit id is not valid.';
  if (typeof k.name !== 'string' || !k.name.trim() || k.name.length > 80)
    return 'Kit name must be 1–80 characters.';
  if (!inRange(k.bpm, 40, 240)) return 'BPM must be 40 to 240.';
  if (typeof k.created_at !== 'string' || typeof k.updated_at !== 'string')
    return 'Kit timestamps are missing.';
  if (!Array.isArray(k.pads) || k.pads.length !== padCount)
    return 'A kit has exactly ' + padCount + ' pads.';
  for (let i = 0; i < padCount; i++) {
    const p = k.pads[i] as unknown;
    if (!isObject(p) || p.note !== firstPadNote + i)
      return 'Pad ' + (i + 1) + ' has the wrong note.';
    if (
      !Array.isArray(p.layers) ||
      p.layers.length !== layerCount ||
      !p.layers.every((s) => s === null || isSoundId(s))
    )
      return 'Pad ' + (i + 1) + ' layers must be 3 sound ids or null.';
    const l = p.launch;
    if (
      !isObject(l) ||
      !oneOf(l.lands_on, launchGrids) ||
      !oneOf(l.mode, launchModes) ||
      typeof l.sync !== 'boolean' ||
      typeof l.reverse !== 'boolean'
    )
      return 'Pad ' + (i + 1) + ' launch settings are not valid.';
  }
  if (
    !Array.isArray(k.macros) ||
    k.macros.length !== macroCount ||
    !k.macros.every((m) => inRange(m, 0, 1))
  )
    return 'Macros must be ' + macroCount + ' values from 0 to 1.';
  const whole = checkRanges(k.whole, wholeRanges, 'whole');
  if (whole) return whole;
  if (!Array.isArray(k.layers) || k.layers.length !== layerCount)
    return 'A kit has exactly ' + layerCount + ' layer settings.';
  for (let i = 0; i < layerCount; i++) {
    const layer = k.layers[i] as unknown;
    if (!isObject(layer)) return 'Layer ' + (i + 1) + ' is missing.';
    const bad =
      checkRanges(layer.tone, toneRanges, 'layer ' + (i + 1) + ' tone') ??
      checkRanges(layer.grain, grainRanges, 'layer ' + (i + 1) + ' grain');
    if (bad) return bad;
    if (typeof (layer.grain as Record<string, unknown>).freeze !== 'boolean')
      return 'Layer ' + (i + 1) + ' freeze must be true or false.';
    const m = layer.motion;
    if (
      !isObject(m) ||
      !oneOf(m.lfo1_rate, syncRates) ||
      !oneOf(m.lfo2_rate, syncRates) ||
      !oneOf(m.lfo1_shape, lfoShapes) ||
      !oneOf(m.lfo2_shape, lfoShapes)
    )
      return 'Layer ' + (i + 1) + ' motion settings are not valid.';
  }
  if (!Array.isArray(k.mod) || k.mod.length !== modSlotCount)
    return 'The mod matrix has exactly ' + modSlotCount + ' rows.';
  for (const slot of k.mod as unknown[])
    if (
      !isObject(slot) ||
      !oneOf(slot.source, modSources) ||
      !oneOf(slot.destination, modDestinations) ||
      !inRange(slot.amount, -1, 1)
    )
      return 'A mod matrix row is not valid.';
  const fx = checkRanges(k.fx, fxRanges, 'fx');
  if (fx) return fx;
  const f = k.fx as Record<string, unknown>;
  if (!oneOf(f.delay_time, syncRates) || typeof f.soft_clip !== 'boolean')
    return 'fx delay time or soft clip is not valid.';
  return null;
}

export interface SliceRequest {
  /** 'song' slices a library song or stem; 'gold' slices a usable voice's Gold Vocal. */
  from: 'song' | 'gold';
  song_id?: string;
  stem?: 'main' | StemName;
  voice_id?: string;
  /** Manual: one region. Auto: silence-split the range into up to 64 slices. */
  mode: 'manual' | 'auto';
  start_seconds: number;
  end_seconds: number;
  name: string;
  category: SoundCategory;
}

export function validateSliceRequest(value: unknown): string | null {
  if (!isObject(value)) return 'Invalid slice request.';
  const r = value;
  if (r.from === 'song') {
    if (!isSoundId(r.song_id)) return 'Choose a library song.';
    if (r.stem !== undefined && r.stem !== 'main' && !oneOf(r.stem, stemNames))
      return 'Unknown stem.';
  } else if (r.from === 'gold') {
    if (typeof r.voice_id !== 'string' || r.voice_id.length > 80) return 'Choose a voice.';
  } else return 'from must be song or gold.';
  if (r.mode !== 'manual' && r.mode !== 'auto') return 'mode must be manual or auto.';
  if (!inRange(r.start_seconds, 0, 3600) || !inRange(r.end_seconds, 0, 3600))
    return 'Start and end must be seconds within the audio.';
  const length = r.end_seconds - r.start_seconds;
  if (length < 0.05) return 'A slice must be at least 0.05 seconds long.';
  if (r.mode === 'manual' && length > maxSoundSeconds)
    return 'A slice can be at most ' + maxSoundSeconds + ' seconds long.';
  if (r.mode === 'auto' && length > 600) return 'Auto-slice at most 10 minutes at a time.';
  if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > 80)
    return 'Name must be 1–80 characters.';
  if (!oneOf(r.category, soundCategories)) return 'Unknown category.';
  return null;
}

export const sfxModels = ['eleven_text_to_sound_v2', 'eleven_text_to_sound_v3'] as const;
export type SfxModel = (typeof sfxModels)[number];
export interface SfxRequest {
  prompt: string;
  duration_seconds: number | null;
  loop: boolean;
  prompt_influence: number;
  model: SfxModel;
  name: string;
  category: SoundCategory;
}

export function validateSfxRequest(value: unknown): string | null {
  if (!isObject(value)) return 'Invalid sound request.';
  const r = value;
  if (typeof r.prompt !== 'string' || r.prompt.trim().length < 3 || r.prompt.length > 450)
    return 'Describe the sound in 3–450 characters.';
  if (r.duration_seconds !== null && !inRange(r.duration_seconds, 0.5, 30))
    return 'Length must be automatic or 0.5 to 30 seconds.';
  if (typeof r.loop !== 'boolean') return 'loop must be true or false.';
  if (!inRange(r.prompt_influence, 0, 1)) return 'Prompt influence must be 0 to 1.';
  if (!oneOf(r.model, sfxModels)) return 'Unknown sound model.';
  if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > 80)
    return 'Name must be 1–80 characters.';
  if (!oneOf(r.category, soundCategories)) return 'Unknown category.';
  return null;
}
