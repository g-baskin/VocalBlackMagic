/** Shared voice registry entry: <data dir>/shared/voices/<id>.json, written by Vocal Fix, read by TTB Studio. */
export type VoiceModelStatus = 'training' | 'ready' | 'failed';

export interface VoiceConsent {
  own_voice: true;
  attested_name: string;
  statement: string;
  attested_at: string;
  session_id: string;
}

export interface VoiceModel {
  id: string;
  performer: string;
  status: VoiceModelStatus;
  created_at: string;
  consent: VoiceConsent;
  provider: 'replicate';
  model_url: string | null;
  /** Local trained model archive: a basename inside <data>/shared/voices (model_url expires). */
  model_file?: string;
  profile?: Record<string, string>;
  error?: string;
}

export const voiceIdPattern =
  /^voice-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isVoiceModel(value: unknown): value is VoiceModel {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const c = v.consent as Record<string, unknown> | undefined;
  return (
    typeof v.id === 'string' &&
    typeof v.performer === 'string' &&
    (v.status === 'training' || v.status === 'ready' || v.status === 'failed') &&
    typeof v.created_at === 'string' &&
    v.provider === 'replicate' &&
    (v.model_url === null || typeof v.model_url === 'string') &&
    (v.model_file === undefined || isSafeModelFile(v.model_file)) &&
    !!c &&
    c.own_voice === true &&
    typeof c.attested_name === 'string' &&
    typeof c.statement === 'string' &&
    typeof c.attested_at === 'string' &&
    typeof c.session_id === 'string'
  );
}

/** model_file must be '<voice id>.model.zip' with no directory part. */
export function isSafeModelFile(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.endsWith('.model.zip') &&
    voiceIdPattern.test(value.slice(0, -'.model.zip'.length))
  );
}
