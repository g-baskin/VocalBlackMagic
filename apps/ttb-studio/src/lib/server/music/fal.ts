import type { GenerationJobStatus, GenerationRequest } from '@vbm/contracts';
import { ProviderError } from './errors';
import { styleDescription, sungLyrics } from './prompt';

const queueBase = 'https://queue.fal.run';
// Queue status and result URLs use only owner/app, never the endpoint sub-path.
const falApp = 'fal-ai/ace-step';
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface FalDeps {
  apiKey: string;
  fetch: typeof fetch;
}

export function isFalRequestId(id: string): boolean {
  return requestIdPattern.test(id);
}

export function buildFalSubmission(request: GenerationRequest): { endpoint: string; body: Record<string, unknown> } {
  const style = styleDescription(request);
  const lyrics = sungLyrics(request);
  const common = { duration: request.duration_seconds, enable_safety_checker: true };
  if (lyrics) return { endpoint: 'fal-ai/ace-step', body: { tags: style, lyrics, ...common } };
  return {
    endpoint: 'fal-ai/ace-step/prompt-to-audio',
    body: { prompt: style, instrumental: request.mode === 'instrumental', ...common }
  };
}

function headers(apiKey: string): Record<string, string> {
  return { authorization: 'Key ' + apiKey, 'content-type': 'application/json', accept: 'application/json' };
}

async function failure(response: Response, action: string): Promise<ProviderError> {
  const text = (await response.text().catch(() => '')).slice(0, 300);
  const detail = 'fal ' + action + ' failed with ' + response.status + ': ' + text;
  if (response.status === 401 || response.status === 403)
    return new ProviderError(502, 'fal rejected the API key. Check FAL_KEY.', detail);
  if (response.status === 402) return new ProviderError(402, 'The fal account has no remaining credit.', detail);
  if (response.status === 429) return new ProviderError(429, 'fal is rate limiting requests. Try again shortly.', detail);
  if (action === 'submit' && response.status === 422) return new ProviderError(422, 'fal rejected the song request.', detail);
  if (action !== 'submit' && response.status === 404) return new ProviderError(404, 'Generation job not found.', detail);
  return new ProviderError(502, 'fal could not process the request.', detail);
}

export async function submitFal(deps: FalDeps, request: GenerationRequest): Promise<string> {
  const { endpoint, body } = buildFalSubmission(request);
  const response = await deps.fetch(queueBase + '/' + endpoint, {
    method: 'POST', headers: headers(deps.apiKey), body: JSON.stringify(body), signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw await failure(response, 'submit');
  const data: unknown = await response.json();
  const id = typeof data === 'object' && data !== null ? (data as { request_id?: unknown }).request_id : undefined;
  if (typeof id !== 'string' || !isFalRequestId(id))
    throw new ProviderError(502, 'fal returned an unexpected response.', 'fal submit response missing request_id');
  return id.toLowerCase();
}

export async function falStatus(deps: FalDeps, id: string): Promise<{ status: GenerationJobStatus; detail?: string }> {
  const response = await deps.fetch(queueBase + '/' + falApp + '/requests/' + id + '/status', {
    headers: headers(deps.apiKey), signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw await failure(response, 'status');
  const data = (await response.json()) as { status?: unknown; error?: unknown };
  if (data.status === 'IN_QUEUE') return { status: 'queued' };
  if (data.status === 'IN_PROGRESS') return { status: 'running' };
  if (data.status === 'COMPLETED') {
    if (data.error !== undefined && data.error !== null) {
      console.error('fal job failed:', String(data.error).slice(0, 300));
      return { status: 'failed', detail: 'The provider could not generate this song.' };
    }
    return { status: 'completed' };
  }
  throw new ProviderError(502, 'fal returned an unknown job status.', 'fal status ' + String(data.status));
}

export function isAllowedFalMediaUrl(raw: string): boolean {
  let url: URL;
  try { url = new URL(raw); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  if (host === 'fal.media' || host.endsWith('.fal.media')) return true;
  return host === 'storage.googleapis.com' && url.pathname.startsWith('/falserverless/');
}

export async function falAudioUrl(deps: FalDeps, id: string): Promise<string> {
  const response = await deps.fetch(queueBase + '/' + falApp + '/requests/' + id, {
    headers: headers(deps.apiKey), signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw await failure(response, 'result');
  const data = (await response.json()) as { audio?: { url?: unknown } };
  const url = data.audio?.url;
  if (typeof url !== 'string' || !isAllowedFalMediaUrl(url))
    throw new ProviderError(502, 'fal returned an unexpected audio location.', 'fal audio url rejected');
  return url;
}
