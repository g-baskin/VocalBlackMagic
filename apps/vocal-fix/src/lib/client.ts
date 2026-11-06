/** Browser helpers for the Vocal Fix API. Every mutating call is non-simple (JSON or custom header). */
export interface Finding {
  severity: 'info' | 'warning' | 'problem';
  text: string;
  region?: { start: number; end: number; label: string };
}
export interface Scores {
  loudness: number;
  clipping: number;
  noise: number;
  dynamics: number;
  overall: number;
}
export interface DiagnosisView {
  duration_seconds: number;
  loudness: { integrated_lufs: number | null; true_peak_dbtp: number | null };
  noise_floor_db: number;
  snr_db: number;
  clipped_samples: number;
  silence_ratio: number;
  scores: Scores;
  findings: Finding[];
  regions: { start: number; end: number; label: string }[];
}
export interface RecordingView {
  id: string;
  index: number;
  original_name: string;
  stored_name: string;
  bytes: number;
  sha256: string;
  integrity_verified: boolean;
  probe: { codec: string; duration_seconds: number; sample_rate: number; channels: number };
  diagnosis?: DiagnosisView;
}
export interface VersionView {
  id: string;
  kind: string;
  source_ids: string[];
  file: string;
  created_at: string;
  params: Record<string, unknown>;
  diagnosis?: DiagnosisView;
}
export interface SessionView {
  id: string;
  mode: 'fix' | 'forge';
  performer: string;
  created_at: string;
  recordings: RecordingView[];
  versions: VersionView[];
  gold?: {
    version: string;
    sidecar: string;
    selected: string[];
    phrases: unknown[];
    segments: unknown[];
  };
  profile?: Record<string, string>;
  voices: string[];
}

export async function api<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(init.json);
  } else if (init.method && init.method !== 'GET') headers.set('x-vbm-intent', 'vocal-fix');
  const res = await fetch(path, { ...init, headers, body });
  if (res.status === 204) return undefined as T;
  const data: unknown = await res
    .json()
    .catch(() => ({ detail: 'Unexpected response (' + res.status + ').' }));
  if (!res.ok)
    throw new Error((data as { detail?: string }).detail ?? 'Request failed (' + res.status + ').');
  return data as T;
}

export const audioUrl = (sid: string, area: 'originals' | 'derived', file: string) =>
  '/api/sessions/' + sid + '/audio/' + area + '/' + file;

export const meterTone = (v: number): 'good' | 'warn' | 'bad' =>
  v >= 0.75 ? 'good' : v >= 0.45 ? 'warn' : 'bad';
