/**
 * VBM Engine protocol v1: the HTTP contract between TTB Studio and a self-hosted music engine
 * (services/audio-engine). Full description: docs/ENGINE_PROTOCOL.md. The Python worker
 * mirrors these shapes; change both together and bump ENGINE_PROTOCOL_VERSION.
 */
export const ENGINE_PROTOCOL_VERSION = 1;

/** Open models the self-hosted engine may serve. */
export const engineModelIds = ['ace-step-1.5', 'heartmula', 'diffrhythm-2', 'yue2'] as const;
export type EngineModelId = (typeof engineModelIds)[number];

/** What a job asks the model to do. Not every model supports every task (see EngineModelInfo.tasks). */
export const engineTasks = ['text2music', 'extend', 'repaint', 'cover'] as const;
export type EngineTask = (typeof engineTasks)[number];

export type EngineJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type EngineDevice = 'cuda' | 'mps' | 'cpu';
export type EngineAudioFormat = 'wav' | 'flac' | 'mp3';

export interface EngineModelInfo {
  id: EngineModelId;
  /** SPDX-style licence of the weights, e.g. "MIT", "Apache-2.0", "CC-BY-NC-4.0". */
  license: string;
  /** False when the weights' licence forbids commercial use (show a clear label in the UI). */
  commercial: boolean;
  /** Weights present on disk and the backend importable. */
  installed: boolean;
  /** Can accept jobs now (installed, enabled and fits this device). */
  ready: boolean;
  tasks: EngineTask[];
  max_duration_seconds: number;
  /** Why it is not ready, in plain words. */
  reason?: string;
}

/** GET /v1/health (no auth): process and model readiness, never faked. */
export interface EngineHealth {
  ok: boolean;
  protocol: number;
  version: string;
  device: EngineDevice;
  /** Jobs that may run at once on this machine (GPU slots). */
  concurrency: number;
  queued: number;
  running: number;
  models: EngineModelInfo[];
}

export interface EngineSourceAudio {
  /** Base64 audio bytes (no data: prefix). The engine rejects anything over 50 MiB decoded. */
  data_b64: string;
  format: EngineAudioFormat;
}

/** POST /v1/jobs (Bearer auth, optional Idempotency-Key header). */
export interface EngineJobRequest {
  model: EngineModelId;
  task: EngineTask;
  /** Style / description tags. 1 to 2000 characters. */
  prompt: string;
  /** Lyrics with [Verse]/[Chorus] section tags; empty or absent for instrumental. Max 6000 characters. */
  lyrics?: string;
  instrumental?: boolean;
  /** Target length for text2music. 5 to 600 seconds, clamped to the model's max. */
  duration_seconds?: number;
  seed?: number;
  /** Required for extend, repaint and cover. */
  source_audio?: EngineSourceAudio;
  /** repaint: regenerate only this time range (seconds) of source_audio, keeping the rest. */
  repaint?: { start_seconds: number; end_seconds: number };
  /** extend: add new music before and/or after source_audio. */
  extend?: { before_seconds?: number; after_seconds?: number };
  /** cover: keep the structure of source_audio, restyle it. 0 = keep everything, 1 = ignore source. */
  cover?: { strength: number };
  /** Model-specific knobs (steps, guidance, ...). Unknown keys are ignored. */
  options?: Record<string, number | string | boolean>;
}

export interface EngineJobOutput {
  /** Relative URL on the engine: GET it (Bearer auth) for the audio bytes. */
  audio_url: string;
  format: EngineAudioFormat;
  duration_seconds: number;
  sample_rate: number;
  seed: number;
}

/** POST /v1/jobs -> 202, GET /v1/jobs/{id} -> 200, DELETE /v1/jobs/{id} -> 200. */
export interface EngineJob {
  id: string;
  status: EngineJobStatus;
  model: EngineModelId;
  task: EngineTask;
  created_at: string;
  /** 0 to 1 when the backend can report it. */
  progress?: number;
  stage?: string;
  error?: string;
  output?: EngineJobOutput;
}

/** Error body for every non-2xx response. */
export interface EngineError {
  detail: string;
  code:
    | 'unauthorized'
    | 'invalid_request'
    | 'model_not_ready'
    | 'unsupported_task'
    | 'too_large'
    | 'queue_full'
    | 'not_found'
    | 'internal';
}

const MAX_PROMPT = 2000;

/** Job ids the engine issues and the Studio accepts. */
export const engineJobIdPattern = /^[A-Za-z0-9_-]{1,80}$/;

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const MAX_LYRICS = 6000;

/** Shared request validation (the Python engine applies the same rules). Returns a reason or null. */
export function validateEngineJobRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object.';
  const r = body as Partial<EngineJobRequest>;
  if (!engineModelIds.includes(r.model as EngineModelId)) return 'Unknown model.';
  if (!engineTasks.includes(r.task as EngineTask)) return 'Unknown task.';
  if (typeof r.prompt !== 'string' || !r.prompt.trim() || r.prompt.length > MAX_PROMPT)
    return `prompt must be 1 to ${MAX_PROMPT} characters.`;
  if (r.seed !== undefined && (!num(r.seed) || !Number.isInteger(r.seed) || r.seed < 0))
    return 'seed must be a non-negative integer.';
  if (r.instrumental !== undefined && typeof r.instrumental !== 'boolean')
    return 'instrumental must be true or false.';
  if (r.lyrics !== undefined && (typeof r.lyrics !== 'string' || r.lyrics.length > MAX_LYRICS))
    return `lyrics must be at most ${MAX_LYRICS} characters.`;
  if (
    r.duration_seconds !== undefined &&
    (!num(r.duration_seconds) || r.duration_seconds < 5 || r.duration_seconds > 600)
  )
    return 'duration_seconds must be 5 to 600.';
  const needsSource = r.task === 'extend' || r.task === 'repaint' || r.task === 'cover';
  if (needsSource) {
    const s = r.source_audio;
    if (!s || typeof s.data_b64 !== 'string' || !s.data_b64) return `${r.task} needs source_audio.`;
    if (!['wav', 'flac', 'mp3'].includes(s.format))
      return 'source_audio.format must be wav, flac or mp3.';
  }
  if (r.task === 'repaint') {
    const p = r.repaint;
    if (
      !p ||
      !num(p.start_seconds) ||
      !num(p.end_seconds) ||
      p.start_seconds < 0 ||
      p.end_seconds <= p.start_seconds
    )
      return 'repaint needs 0 <= start_seconds < end_seconds.';
  }
  if (r.task === 'extend') {
    const e = r.extend;
    const before = e?.before_seconds ?? 0;
    const after = e?.after_seconds ?? 0;
    if (
      !num(before) ||
      !num(after) ||
      before < 0 ||
      after < 0 ||
      before + after <= 0 ||
      before + after > 240
    )
      return 'extend needs before_seconds and/or after_seconds, 240 s in total at most.';
  }
  if (r.task === 'cover') {
    const c = r.cover;
    if (!c || !num(c.strength) || c.strength < 0 || c.strength > 1)
      return 'cover.strength must be 0 to 1.';
  }
  return null;
}
