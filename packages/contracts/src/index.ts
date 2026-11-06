export const soundCharacters = ['raw', 'vintage', 'live', 'clean', 'custom'] as const;
export type SoundCharacter = (typeof soundCharacters)[number];
export const soundCharacterNames: Record<SoundCharacter, string> = {
  raw: 'Raw / Underground',
  vintage: 'Vintage / Analog',
  live: 'Live / Organic',
  clean: 'Studio Clean',
  custom: 'Custom'
};
export const generationEngines = ['ace-step', 'lyria-3.5', 'heartmula', 'external-v2'] as const;
export type GenerationEngine = (typeof generationEngines)[number];
export type SongMode = 'full-song' | 'instrumental';
export interface GenerationRequest {
  prompt: string;
  lyrics: string | null;
  mode: SongMode;
  engine: GenerationEngine;
  sound_character: SoundCharacter;
  premium_studio: boolean;
  texture: number;
  human_variation: number;
  mastering_intensity: number;
  duration_seconds: number;
}
export const minSongSeconds = 10;
export const maxSongSeconds = 240;
export type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed';
export interface InlineAudio {
  content_type: 'audio/mpeg' | 'audio/wav';
  data_base64: string;
  bytes: number;
}
export interface GenerationJob {
  job_id: string;
  engine: GenerationEngine;
  status: GenerationJobStatus;
  detail?: string;
  audio_url?: string;
  audio?: InlineAudio;
  lyrics?: string | null;
}
export interface EngineCapability {
  id: GenerationEngine;
  name: string;
  status: string;
}
export interface TTBCapabilities {
  architecture: string;
  engines: EngineCapability[];
  sound_characters: SoundCharacter[];
  premium_studio: { selectable: boolean; processing_ready: boolean };
  generation_ready: boolean;
}
export interface UploadedRecording {
  index: number;
  original_name: string;
  stored_name: string;
  bytes: number;
  integrity_verified: boolean;
}
export interface VocalReferenceSession {
  session_id: string;
  voice_owner: string;
  acknowledged_rights: boolean;
  created_at: string;
  status: string;
  gold_vocal_ready: boolean;
  recordings: UploadedRecording[];
  note: string;
}
export function validateGenerationRequest(request: GenerationRequest): string | null {
  if (request.prompt.trim().length < 5 || request.prompt.length > 3000)
    return 'Prompt must be 5–3000 characters.';
  if (request.lyrics && request.lyrics.length > 15000) return 'Lyrics exceed 15,000 characters.';
  if (!generationEngines.includes(request.engine)) return 'Unknown generation engine.';
  if (!soundCharacters.includes(request.sound_character)) return 'Unknown sound character.';
  if (request.mode !== 'full-song' && request.mode !== 'instrumental') return 'Unknown song mode.';
  if (
    !Number.isInteger(request.duration_seconds) ||
    request.duration_seconds < minSongSeconds ||
    request.duration_seconds > maxSongSeconds
  )
    return (
      'duration_seconds must be an integer from ' + minSongSeconds + ' to ' + maxSongSeconds + '.'
    );
  for (const field of ['texture', 'human_variation', 'mastering_intensity'] as const) {
    if (!Number.isInteger(request[field]) || request[field] < 0 || request[field] > 100)
      return field + ' must be an integer from 0 to 100.';
  }
  return null;
}
export * from './voice';
export * from './studio';
