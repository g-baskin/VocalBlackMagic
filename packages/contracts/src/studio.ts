import { soundCharacters, type SoundCharacter } from './index';

/** Engines the TTB Studio song library can create songs with. */
export const studioEngines = [
  'minimax-music-1.5',
  'ace-step-replicate',
  'stable-audio-2.5',
  'lyria-2',
  'fal-ace-step',
  'lyria-3.5'
] as const;
export type StudioEngine = (typeof studioEngines)[number];

/** Models x runners: what makes the music, independent of who runs it (see capabilities.models). */
export const studioModels = [
  'ace-step-1.5',
  'heartmula',
  'diffrhythm',
  'yue',
  'minimax-music-2.6',
  'lyria-3-pro',
  'elevenlabs-music'
] as const;
export type StudioModel = (typeof studioModels)[number];

/** Which runner ran a song and every runner tried before it, with the reason each was skipped. */
export interface StudioRunnerRecord {
  model: StudioModel;
  runner: string;
  model_version: string;
  license: string;
  commercial: boolean;
  attempts: { runner: string; model_version: string; outcome: string }[];
}

export interface StudioEngineInfo {
  id: StudioEngine;
  name: string;
  /** 'ready' or the reason it cannot run (for example 'needs FAL_KEY'). */
  status: string;
  vocals: boolean;
  instrumental: boolean;
  /** Inclusive duration range in seconds, or null when the model picks the length. */
  duration: { min: number; max: number } | null;
  max_lyrics: number | null;
  max_prompt: number;
  est_cost_usd: number;
}

export const songKinds = [
  'original',
  'reimagine',
  'stems',
  'voice',
  'master',
  'extend',
  'repaint',
  'restyle'
] as const;
export type SongKind = (typeof songKinds)[number];
export const stemNames = ['vocals', 'drums', 'bass', 'other'] as const;
export type StemName = (typeof stemNames)[number];

export interface StoredAudio {
  file: string;
  content_type: string;
  bytes: number;
}

export interface SongMeta {
  id: string;
  title: string;
  prompt: string;
  style_tags: string[];
  lyrics: string | null;
  engine: string;
  params: Record<string, string | number | boolean | null>;
  created_at: string;
  parent_id: string | null;
  kind: SongKind;
  favourite: boolean;
  audio: StoredAudio | null;
  stems?: (StoredAudio & { name: StemName })[];
  voice?: { voice_id: string; performer: string; consent_ref: string; attested_at: string };
  master?: {
    input_lufs: number | null;
    output_lufs: number | null;
    output_true_peak: number | null;
  };
  est_cost_usd: number;
  /** Set for séance takes; the song is sealed (model hidden) until that séance is revealed. */
  seance_id?: string;
  /** Set for songs made through the models x runners router. */
  runner?: StudioRunnerRecord;
  /** Cover image; inherited_from names the song it was copied from. */
  cover?: StoredAudio & { inherited_from?: string };
}

export type StudioJobKind = 'create' | 'reimagine' | 'stems' | 'voice' | 'edit';
export type StudioJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
export type StageState = 'pending' | 'active' | 'done' | 'failed';
export interface JobStage {
  id: string;
  label: string;
  state: StageState;
}

export interface StudioJob {
  id: string;
  kind: StudioJobKind;
  status: StudioJobStatus;
  stages: JobStage[];
  detail?: string;
  song_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateSongRequest {
  mode: 'simple' | 'custom';
  /** Simple: the song description. Custom: style prompt. */
  prompt: string;
  title: string;
  lyrics: string | null;
  style_tags: string[];
  instrumental: boolean;
  /** Legacy engine id; ignored when model is set. */
  engine: StudioEngine;
  /** Model to run through the router (first ready runner: engine, provider API, Replicate). */
  model?: StudioModel | null;
  duration_seconds: number | null;
  sound_character: SoundCharacter;
  takes: 1 | 2;
  /** Conjure cover art for each take (default true). */
  cover?: boolean;
  /** Sung by a forged voice (MiniMax Music-01 with the voice's Gold Vocal as reference). */
  voice_id?: string | null;
  /** Library song whose music is the instrumental reference for a voice summon. */
  reference_song_id?: string | null;
}

export type LyricsAction = 'write' | 'rewrite' | 'extend';
export interface LyricsRequest {
  action: LyricsAction;
  description: string;
  lyrics: string;
  instruction: string;
  max_chars: number;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Shape and range checks shared by the UI and the server. Engine limits are checked separately. */
export function validateCreateSongRequest(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Invalid song request.';
  const r = value as Record<string, unknown>;
  if (r.mode !== 'simple' && r.mode !== 'custom') return 'mode must be simple or custom.';
  if (typeof r.prompt !== 'string' || r.prompt.trim().length < 5 || r.prompt.length > 3000)
    return 'Describe the song in 5–3000 characters.';
  if (typeof r.title !== 'string' || r.title.length > 120)
    return 'Title must be at most 120 characters.';
  if (r.lyrics !== null && (typeof r.lyrics !== 'string' || r.lyrics.length > 15000))
    return 'Lyrics must be text of at most 15,000 characters.';
  if (
    !isStringArray(r.style_tags) ||
    r.style_tags.length > 20 ||
    r.style_tags.some((t) => t.length > 40)
  )
    return 'Use at most 20 style tags of up to 40 characters.';
  if (typeof r.instrumental !== 'boolean') return 'instrumental must be true or false.';
  if (typeof r.engine !== 'string' || !(studioEngines as readonly string[]).includes(r.engine))
    return 'Unknown engine.';
  if (
    r.model !== undefined &&
    r.model !== null &&
    !(studioModels as readonly string[]).includes(r.model as string)
  )
    return 'Unknown model.';
  if (
    r.duration_seconds !== null &&
    (typeof r.duration_seconds !== 'number' ||
      !Number.isInteger(r.duration_seconds) ||
      r.duration_seconds < 10 ||
      r.duration_seconds > 240)
  )
    return 'duration_seconds must be null or an integer from 10 to 240.';
  if (
    typeof r.sound_character !== 'string' ||
    !(soundCharacters as readonly string[]).includes(r.sound_character)
  )
    return 'Unknown sound character.';
  if (r.takes !== 1 && r.takes !== 2) return 'takes must be 1 or 2.';
  if (r.cover !== undefined && typeof r.cover !== 'boolean') return 'cover must be true or false.';
  if (r.voice_id !== undefined && r.voice_id !== null && typeof r.voice_id !== 'string')
    return 'voice_id must be text.';
  if (
    r.reference_song_id !== undefined &&
    r.reference_song_id !== null &&
    typeof r.reference_song_id !== 'string'
  )
    return 'reference_song_id must be text.';
  if (r.voice_id && !r.reference_song_id)
    return 'Choose a library song as the music reference for a voice summon.';
  return null;
}

export function validateLyricsRequest(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Invalid lyrics request.';
  const r = value as Record<string, unknown>;
  if (r.action !== 'write' && r.action !== 'rewrite' && r.action !== 'extend')
    return 'action must be write, rewrite or extend.';
  if (typeof r.description !== 'string' || r.description.length > 3000)
    return 'Description must be at most 3000 characters.';
  if (typeof r.lyrics !== 'string' || r.lyrics.length > 15000)
    return 'Lyrics must be at most 15,000 characters.';
  if (typeof r.instruction !== 'string' || r.instruction.length > 1000)
    return 'Instruction must be at most 1000 characters.';
  if (r.action === 'write' && r.description.trim().length < 5) return 'Describe the song first.';
  if (r.action !== 'write' && r.lyrics.trim().length < 10) return 'Paste lyrics to work on first.';
  if (
    typeof r.max_chars !== 'number' ||
    !Number.isInteger(r.max_chars) ||
    r.max_chars < 100 ||
    r.max_chars > 4096
  )
    return 'max_chars must be an integer from 100 to 4096.';
  return null;
}

/** One runner (who runs a model) in the capabilities API. */
export interface StudioRunnerInfo {
  kind: 'engine' | 'fal' | 'minimax' | 'elevenlabs' | 'gemini' | 'replicate';
  /** Exact model and version this runner runs. */
  model_version: string;
  license: string;
  commercial: boolean;
  /** 'Non-commercial' when the weights forbid commercial use, otherwise the licence name. */
  license_badge: string;
  /** 'ready' or the plain reason it cannot run (for example 'needs ELEVENLABS_API_KEY'). */
  status: string;
}

/** A model (what makes the music) with its runners in preference order. */
export interface StudioModelInfo {
  id: string;
  name: string;
  open: boolean;
  vocals: boolean;
  instrumental: boolean;
  runners: StudioRunnerInfo[];
  /** Rough per-take estimate in USD (no billing guarantee). */
  est_cost_usd: number;
  /** First ready runner, or null when none can run it now. */
  active_runner: StudioRunnerInfo['kind'] | null;
}

/* ---- The Séance: blind comparison of 2 to 4 models on the same prompt and lyrics ---- */

export const seanceLabels = ['A', 'B', 'C', 'D'] as const;
export type SeanceLabel = (typeof seanceLabels)[number];

export interface SeanceRequest {
  prompt: string;
  lyrics?: string | null;
  title?: string;
  instrumental?: boolean;
  /** 2 to 4 distinct models. */
  models: StudioModel[];
}

/** One anonymised take. model and runner are present only once the séance is revealed. */
export interface SeanceEntry {
  label: SeanceLabel;
  status: StudioJobStatus;
  stages: JobStage[];
  detail?: string;
  song_id: string | null;
  /** 1 = best, set by the ranking. */
  rank: number | null;
  model?: StudioModel;
  runner?: string;
}

export interface Seance {
  id: string;
  prompt: string;
  lyrics: string | null;
  instrumental: boolean;
  created_at: string;
  revealed: boolean;
  /** Labels best to worst, once ranked. */
  ranking: SeanceLabel[] | null;
  entries: SeanceEntry[];
}

export interface SeanceLeaderRow {
  model: StudioModel;
  runner: string;
  appearances: number;
  wins: number;
  win_rate: number;
  mean_rank: number;
}

const seanceMaxPrompt = 2000;
const seanceMaxLyrics = 6000;

/** Shape checks for POST /api/studio/seances (readiness is checked on the server). */
export function validateSeanceRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return 'Body must be a JSON object.';
  const r = body as Record<string, unknown>;
  if (typeof r.prompt !== 'string' || !r.prompt.trim() || r.prompt.length > seanceMaxPrompt)
    return 'prompt must be 1 to ' + seanceMaxPrompt + ' characters.';
  if (
    r.lyrics !== undefined &&
    r.lyrics !== null &&
    (typeof r.lyrics !== 'string' || r.lyrics.length > seanceMaxLyrics)
  )
    return 'lyrics must be at most ' + seanceMaxLyrics + ' characters.';
  if (r.title !== undefined && (typeof r.title !== 'string' || r.title.length > 120))
    return 'title must be at most 120 characters.';
  if (r.instrumental !== undefined && typeof r.instrumental !== 'boolean')
    return 'instrumental must be true or false.';
  if (!Array.isArray(r.models) || r.models.length < 2 || r.models.length > 4)
    return 'Choose 2 to 4 models.';
  if (!r.models.every((m) => (studioModels as readonly unknown[]).includes(m)))
    return 'Unknown model.';
  if (new Set(r.models).size !== r.models.length) return 'Each model may appear only once.';
  return null;
}

/** POST /api/studio/seances/{id}/rank: every label exactly once, best first. */
export function validateSeanceRanking(body: unknown, labels: readonly string[]): string | null {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object.';
  const order = (body as { order?: unknown }).order;
  if (!Array.isArray(order) || order.length !== labels.length)
    return 'order must list every take once, best first.';
  if (new Set(order).size !== order.length || !order.every((l) => labels.includes(l as string)))
    return 'order must list every take once, best first.';
  return null;
}

/** Suno-style edits of a library song; each makes a NEW song with parent_id. */
export const editActions = ['extend', 'repaint', 'cover'] as const;
export type EditAction = (typeof editActions)[number];

export interface EditRequest {
  action: EditAction;
  /** extend: seconds to add before and/or after (240 s in total at most). */
  extend?: { before_seconds?: number; after_seconds?: number };
  /** repaint (replace section): the range to regenerate, inside the song. */
  repaint?: { start_seconds: number; end_seconds: number };
  /** cover (restyle): 0 keeps everything, 1 ignores the source. */
  strength?: number;
  /** New style for the edit (cover: required; repaint/extend: optional, defaults to the song's). */
  prompt?: string;
  /** Lyrics for the new or replaced part (optional). */
  lyrics?: string;
  title?: string;
}

/** Whether an edit can run on a song now, and the runner that would take it. */
export interface StudioEditInfo {
  action: EditAction;
  available: boolean;
  runner: string | null;
  model_version: string | null;
  /** Plain reason when unavailable (every runner's reason, joined). */
  reason: string | null;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Shape and range checks; songSeconds (when known) keeps repaint inside the song. */
export function validateEditRequest(value: unknown, songSeconds: number | null): string | null {
  if (!value || typeof value !== 'object') return 'Invalid edit request.';
  const r = value as Record<string, unknown>;
  if (!(editActions as readonly string[]).includes(r.action as string)) return 'Unknown edit.';
  if (r.prompt !== undefined && (typeof r.prompt !== 'string' || r.prompt.length > 2000))
    return 'Style must be at most 2000 characters.';
  if (r.lyrics !== undefined && (typeof r.lyrics !== 'string' || r.lyrics.length > 6000))
    return 'Lyrics must be at most 6000 characters.';
  if (r.title !== undefined && (typeof r.title !== 'string' || r.title.length > 120))
    return 'Title must be at most 120 characters.';
  if (r.action === 'extend') {
    const e = (r.extend ?? {}) as Record<string, unknown>;
    const before = e.before_seconds ?? 0;
    const after = e.after_seconds ?? 0;
    if (!finite(before) || !finite(after) || before < 0 || after < 0)
      return 'Extend needs seconds of 0 or more.';
    if (before + after <= 0) return 'Add some seconds before or after.';
    if (before + after > 240) return 'Extend adds 240 seconds in total at most.';
  }
  if (r.action === 'repaint') {
    const p = (r.repaint ?? {}) as Record<string, unknown>;
    if (!finite(p.start_seconds) || !finite(p.end_seconds) || p.start_seconds < 0)
      return 'Select the section to replace.';
    // Small tolerance so a 1 s region made of rounded floats (e.g. 0.1 + 0.9) is not refused.
    if (p.end_seconds - p.start_seconds < 1 - 1e-6)
      return 'The section must be at least 1 second long.';
    if (songSeconds !== null && p.end_seconds > songSeconds + 0.05)
      return 'The section ends after the song does.';
  }
  if (r.action === 'cover') {
    if (!finite(r.strength) || r.strength < 0 || r.strength > 1) return 'Strength must be 0 to 1.';
    if (typeof r.prompt !== 'string' || !r.prompt.trim()) return 'Describe the new style.';
  }
  return null;
}
