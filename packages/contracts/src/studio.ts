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

export const songKinds = ['original', 'reimagine', 'stems', 'voice', 'master'] as const;
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
  /** Cover image; inherited_from names the song it was copied from. */
  cover?: StoredAudio & { inherited_from?: string };
}

export type StudioJobKind = 'create' | 'reimagine' | 'stems' | 'voice';
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
  engine: StudioEngine;
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
