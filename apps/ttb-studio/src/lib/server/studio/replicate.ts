import { inspectBase64Audio } from '../music/audio';
import { ProviderError } from '../music/errors';

const apiBase = 'https://api.replicate.com/v1';
const predictionIdPattern = /^[a-z0-9]{10,64}$/;

export interface ReplicateDeps {
  token: string;
  fetch: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A model to run: official models use the model endpoint; community models need a pinned version. */
export interface ReplicateModel {
  owner: string;
  name: string;
  version?: string;
}

export type PredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface Prediction {
  id: string;
  status: PredictionStatus;
  output: unknown;
  error: string | null;
}

export function isPredictionId(id: string): boolean {
  return predictionIdPattern.test(id);
}

function headers(token: string, extra: Record<string, string> = {}): Record<string, string> {
  return { authorization: 'Bearer ' + token, accept: 'application/json', ...extra };
}

export async function replicateFailure(response: Response, action: string): Promise<ProviderError> {
  // Replicate error bodies are problem+json and do not echo the token; keep only a short excerpt.
  const text = (await response.text().catch(() => '')).slice(0, 300);
  const detail = 'replicate ' + action + ' failed with ' + response.status + ': ' + text;
  if (response.status === 401 || response.status === 403)
    return new ProviderError(
      502,
      'Replicate rejected the API token. Check REPLICATE_API_TOKEN.',
      detail
    );
  if (response.status === 402)
    return new ProviderError(402, 'The Replicate account has no remaining credit.', detail);
  if (response.status === 429)
    return new ProviderError(
      429,
      'Replicate is rate limiting requests. Try again shortly.',
      detail
    );
  if (response.status === 422 || response.status === 400)
    return new ProviderError(422, 'Replicate rejected the request inputs.', detail);
  if (response.status === 404)
    return new ProviderError(404, 'The Replicate prediction or model was not found.', detail);
  return new ProviderError(502, 'Replicate could not process the request.', detail);
}

const statuses: readonly string[] = ['starting', 'processing', 'succeeded', 'failed', 'canceled'];

export function parsePrediction(data: unknown): Prediction {
  const record = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
  const id = record.id;
  const status = record.status;
  if (
    typeof id !== 'string' ||
    !isPredictionId(id) ||
    typeof status !== 'string' ||
    !statuses.includes(status)
  )
    throw new ProviderError(
      502,
      'Replicate returned an unexpected response.',
      'bad prediction shape'
    );
  return {
    id,
    status: status as PredictionStatus,
    output: record.output ?? null,
    error:
      typeof record.error === 'string'
        ? record.error.slice(0, 500)
        : record.error
          ? String(record.error)
          : null
  };
}

export async function createPrediction(
  deps: ReplicateDeps,
  model: ReplicateModel,
  input: Record<string, unknown>,
  options: { waitSeconds?: number } = {}
): Promise<Prediction> {
  const url = model.version
    ? apiBase + '/predictions'
    : apiBase + '/models/' + model.owner + '/' + model.name + '/predictions';
  const body = model.version ? { version: model.version, input } : { input };
  const extra: Record<string, string> = { 'content-type': 'application/json' };
  if (options.waitSeconds) extra.prefer = 'wait=' + options.waitSeconds;
  const send = () =>
    deps.fetch(url, {
      method: 'POST',
      headers: headers(deps.token, extra),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(((options.waitSeconds ?? 0) + 20) * 1000)
    });
  let response = await send();
  // Low-credit accounts get a burst of 1 create; a throttled create was not run, so retrying is safe.
  for (let attempt = 0; response.status === 429 && attempt < 4; attempt += 1) {
    const data = (await response.json().catch(() => ({}))) as { retry_after?: unknown };
    const wait = typeof data.retry_after === 'number' ? data.retry_after : 2;
    if (wait > 15)
      return Promise.reject(
        new ProviderError(429, 'Replicate is rate limiting requests. Try again shortly.')
      );
    await (deps.sleep ?? defaultSleep)(Math.ceil(wait * 1000) + 250);
    response = await send();
  }
  if (!response.ok) throw await replicateFailure(response, 'create');
  return parsePrediction(await response.json());
}

export async function getPrediction(deps: ReplicateDeps, id: string): Promise<Prediction> {
  if (!isPredictionId(id)) throw new ProviderError(404, 'Prediction not found.');
  const response = await deps.fetch(apiBase + '/predictions/' + id, {
    headers: headers(deps.token),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw await replicateFailure(response, 'status');
  return parsePrediction(await response.json());
}

export async function cancelPrediction(deps: ReplicateDeps, id: string): Promise<void> {
  if (!isPredictionId(id)) return;
  const response = await deps.fetch(apiBase + '/predictions/' + id + '/cancel', {
    method: 'POST',
    headers: headers(deps.token),
    signal: AbortSignal.timeout(15_000)
  });
  // Cancelling an already finished prediction is not an error worth surfacing.
  if (!response.ok && response.status !== 404 && response.status !== 409)
    throw await replicateFailure(response, 'cancel');
}

/** Uploads a local file so a model can read it; returns the authenticated file URL. */
export async function uploadFile(
  deps: ReplicateDeps,
  bytes: Blob,
  filename: string
): Promise<string> {
  const form = new FormData();
  form.append('content', bytes, filename);
  const response = await deps.fetch(apiBase + '/files', {
    method: 'POST',
    headers: headers(deps.token),
    body: form,
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw await replicateFailure(response, 'upload');
  const data = (await response.json()) as { urls?: { get?: unknown } };
  const url = data.urls?.get;
  if (typeof url !== 'string' || !url.startsWith(apiBase + '/files/'))
    throw new ProviderError(
      502,
      'Replicate returned an unexpected upload response.',
      'upload url missing'
    );
  return url;
}

/** Output files live on replicate.delivery; anything else is refused so a bad output cannot redirect us. */
export function isAllowedOutputUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  if (host === 'replicate.delivery' || host.endsWith('.replicate.delivery')) return true;
  // Official models (for example FLUX) return presigned links on Replicate's R2 output bucket.
  return /^ai-gateway-outputs\.[0-9a-f]{32}\.r2\.cloudflarestorage\.com$/.test(host);
}

/** Text models stream their output as an array of string chunks. */
export function outputText(output: unknown): string {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.every((part) => typeof part === 'string'))
    return output.join('');
  throw new ProviderError(
    502,
    'The lyric model returned an unexpected response.',
    'text output shape'
  );
}

/** Downloads a Replicate output file without sending the token, refusing off-host redirects. */
export async function fetchOutput(fetcher: typeof fetch, url: string): Promise<Response> {
  let current = url;
  for (let hop = 0; hop < 4; hop += 1) {
    if (!isAllowedOutputUrl(current))
      throw new ProviderError(
        502,
        'Replicate returned an unexpected file location.',
        'output url rejected'
      );
    const response = await fetcher(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(180_000)
    });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get('location');
      await response.body?.cancel();
      if (!next) break;
      current = new URL(next, current).toString();
      continue;
    }
    return response;
  }
  throw new ProviderError(502, 'Replicate output could not be downloaded.', 'too many redirects');
}

const dataUriPattern = /^data:audio\/[a-z0-9.+-]+;base64,/i;

/** Outputs are either replicate.delivery URLs or inline base64 audio data URIs. */
export function isOutputRef(raw: unknown): raw is string {
  return isAllowedOutputUrl(raw) || (typeof raw === 'string' && dataUriPattern.test(raw));
}

export async function outputResponse(fetcher: typeof fetch, ref: string): Promise<Response> {
  const match = dataUriPattern.exec(ref);
  if (!match) return fetchOutput(fetcher, ref);
  const data = ref.slice(match[0].length);
  const { kind } = inspectBase64Audio(data);
  return new Response(Buffer.from(data, 'base64'), { headers: { 'content-type': kind } });
}

/** Reads a response body, refusing more than maxBytes (checks the declared length first). */
export async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw new ProviderError(502, 'The provider file is too large.');
  }
  if (!response.body) return new Uint8Array(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ProviderError(502, 'The provider file is too large.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
