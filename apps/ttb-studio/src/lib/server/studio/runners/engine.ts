/**
 * Client for a self-hosted VBM engine, speaking protocol v1 exactly
 * (docs/ENGINE_PROTOCOL.md, packages/contracts/src/engine.ts).
 */
import {
  ENGINE_PROTOCOL_VERSION,
  engineJobIdPattern,
  validateEngineJobRequest,
  type EngineHealth,
  type EngineJob,
  type EngineJobRequest,
  type EngineModelId
} from '@vbm/contracts';
import { ProviderError } from '../../music/errors';
import { isLocalHost } from '../paths';
import { readCapped } from '../replicate';

export interface EngineDeps {
  /** Base URL, for example http://127.0.0.1:8090 (no trailing path). */
  url: string;
  token: string;
  fetch: typeof fetch;
}

/**
 * The engine refused before any job existed, so the router may try the next runner.
 * Anything else thrown at create time (network error, timeout) is ambiguous and must not fall back.
 */
export class RunnerRefused extends ProviderError {
  constructor(status: number, publicMessage: string, logDetail?: string) {
    super(status, publicMessage, logDetail);
    this.name = 'RunnerRefused';
  }
}

const maxAudioBytes = 200 * 1024 * 1024;

function base(deps: EngineDeps): URL {
  const url = new URL(deps.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new ProviderError(503, 'VBM_ENGINE_URL must be an http(s) URL.');
  // The bearer token must not cross a network in cleartext.
  if (url.protocol === 'http:' && !isLocalHost(url.host))
    throw new ProviderError(503, 'VBM_ENGINE_URL must use https unless it is localhost.');
  return url;
}

function at(deps: EngineDeps, path: string): string {
  return new URL(path, base(deps)).toString();
}

function auth(deps: EngineDeps, extra: Record<string, string> = {}): Record<string, string> {
  return { authorization: 'Bearer ' + deps.token, accept: 'application/json', ...extra };
}

async function failure(response: Response, action: string): Promise<ProviderError> {
  const body = (await response.json().catch(() => ({}))) as { detail?: unknown; code?: unknown };
  const detail = typeof body.detail === 'string' ? body.detail.slice(0, 300) : '';
  const code = typeof body.code === 'string' ? body.code : 'unknown';
  const log = 'engine ' + action + ' ' + response.status + ' ' + code + ': ' + detail;
  if (response.status === 401)
    return new ProviderError(502, 'The engine rejected VBM_ENGINE_TOKEN.', log);
  if (response.status === 404) return new ProviderError(404, 'The engine job was not found.', log);
  return new ProviderError(
    response.status === 429 ? 429 : response.status === 422 ? 422 : 502,
    'The self-hosted engine refused: ' + (detail || code),
    log
  );
}

/** GET /v1/health. Throws when the engine is unreachable or speaks another protocol. */
export async function engineHealth(deps: EngineDeps): Promise<EngineHealth> {
  const response = await deps.fetch(at(deps, '/v1/health'), {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(5_000)
  });
  if (!response.ok) throw await failure(response, 'health');
  const health = (await response.json()) as EngineHealth;
  if (health?.protocol !== ENGINE_PROTOCOL_VERSION || !Array.isArray(health.models))
    throw new ProviderError(
      503,
      'The engine speaks protocol ' +
        String(health?.protocol) +
        '; the Studio needs v' +
        ENGINE_PROTOCOL_VERSION +
        '.'
    );
  return health;
}

/** Plain reason the model cannot run on this engine now, or null when it is ready. */
export function engineModelReason(health: EngineHealth, model: EngineModelId): string | null {
  const info = health.models.find((m) => m.id === model);
  if (!info) return 'engine does not serve ' + model;
  if (!info.ready)
    return info.reason || (info.installed ? 'engine model not ready' : 'weights not installed');
  return null;
}

/**
 * POST /v1/jobs. HTTP refusals (4xx/5xx) mean no job was created and throw RunnerRefused;
 * the same Idempotency-Key returns the existing job, so a retry never pays twice.
 */
export async function submitEngineJob(
  deps: EngineDeps,
  request: EngineJobRequest,
  idempotencyKey: string
): Promise<EngineJob> {
  const invalid = validateEngineJobRequest(request);
  if (invalid) throw new RunnerRefused(422, invalid);
  const response = await deps.fetch(at(deps, '/v1/jobs'), {
    method: 'POST',
    headers: auth(deps, { 'content-type': 'application/json', 'idempotency-key': idempotencyKey }),
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60_000)
  });
  if (!response.ok) {
    const error = await failure(response, 'create');
    throw new RunnerRefused(error.status, error.publicMessage, error.logDetail);
  }
  return parseJob(await response.json());
}

function parseJob(data: unknown): EngineJob {
  const job = data as EngineJob;
  if (
    !job ||
    typeof job.id !== 'string' ||
    !engineJobIdPattern.test(job.id) ||
    typeof job.status !== 'string'
  )
    throw new ProviderError(502, 'The engine returned an unexpected job.', 'bad engine job shape');
  return job;
}

export async function getEngineJob(deps: EngineDeps, id: string): Promise<EngineJob> {
  if (!engineJobIdPattern.test(id)) throw new ProviderError(404, 'Engine job not found.');
  const response = await deps.fetch(at(deps, '/v1/jobs/' + id), {
    headers: auth(deps),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw await failure(response, 'status');
  return parseJob(await response.json());
}

export async function cancelEngineJob(deps: EngineDeps, id: string): Promise<void> {
  if (!engineJobIdPattern.test(id)) return;
  const response = await deps.fetch(at(deps, '/v1/jobs/' + id), {
    method: 'DELETE',
    headers: auth(deps),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok && response.status !== 404) throw await failure(response, 'cancel');
}

/** Downloads a finished job's audio; refuses URLs that leave the engine's origin. */
export async function engineAudio(deps: EngineDeps, job: EngineJob): Promise<Response> {
  if (job.status !== 'succeeded' || !job.output)
    throw new ProviderError(502, 'The engine job has no audio.');
  const origin = base(deps);
  const url = new URL(job.output.audio_url, origin);
  if (url.origin !== origin.origin)
    throw new ProviderError(
      502,
      'The engine returned an off-host audio URL.',
      'engine audio url rejected'
    );
  const response = await deps.fetch(url.toString(), {
    headers: { authorization: 'Bearer ' + deps.token },
    redirect: 'error',
    signal: AbortSignal.timeout(180_000)
  });
  if (!response.ok) throw await failure(response, 'audio');
  const bytes = await readCapped(response, maxAudioBytes);
  return new Response(Buffer.from(bytes), {
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/octet-stream' }
  });
}
