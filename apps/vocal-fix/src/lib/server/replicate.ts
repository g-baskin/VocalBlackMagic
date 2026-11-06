import { VocalFixError } from './errors';

const API = 'https://api.replicate.com/v1';

/** Pinned versions read from each model's latest_version (2026-11-06). */
export const MODELS = {
  demucs: {
    ref: 'ryan5453/demucs',
    version: 'ff5ad47d2685b27c0f820ee134c4394140804f08fa755cb20c846459faa4b337',
    est_usd: 0.03
  },
  enhance: {
    ref: 'resemble-ai/resemble-enhance',
    version: '93266a7e7f5805fb79bcf213b1a4e0ef2e45aff3c06eefd96c59e850c87fd6a2',
    est_usd: 0.02
  },
  rvc: {
    ref: 'replicate/train-rvc-model',
    version: '0397d5e28c9b54665e1e5d29d5cf4f722a7b89ec20e9dbf31487235305b1a101',
    est_usd: 0.26
  }
} as const;

export type PredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface Prediction {
  id: string;
  status: PredictionStatus;
  output?: unknown;
  error?: string | null;
}

export function isAllowedOutputUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return (
      u.protocol === 'https:' &&
      (u.hostname === 'replicate.delivery' || u.hostname.endsWith('.replicate.delivery'))
    );
  } catch {
    return false;
  }
}

export class ReplicateClient {
  constructor(
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly retryScale = 1
  ) {}

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { authorization: 'Bearer ' + this.token, ...extra };
  }

  private async json<T>(res: Response, what: string): Promise<T> {
    if (!res.ok) {
      const text = (await res.text().catch(() => '')).slice(0, 200);
      throw new VocalFixError('Replicate ' + what + ' failed (' + res.status + '): ' + text, 502);
    }
    return (await res.json()) as T;
  }

  /** Upload via the Files API; returns the URL usable as model input. */
  async uploadFile(
    bytes: Uint8Array,
    filename: string,
    contentType: string,
    signal?: AbortSignal
  ): Promise<string> {
    const form = new FormData();
    form.append('content', new Blob([new Uint8Array(bytes)], { type: contentType }), filename);
    const res = await this.fetchImpl(API + '/files', {
      method: 'POST',
      headers: this.headers(),
      body: form,
      signal
    });
    const body = await this.json<{ urls?: { get?: string } }>(res, 'file upload');
    if (!body.urls?.get) throw new VocalFixError('Replicate file upload returned no URL.', 502);
    return body.urls.get;
  }

  async create(
    version: string,
    input: Record<string, unknown>,
    signal?: AbortSignal,
    maxRetries = 6
  ): Promise<Prediction> {
    for (let attempt = 0; ; attempt++) {
      const res = await this.fetchImpl(API + '/predictions', {
        method: 'POST',
        headers: this.headers({ 'content-type': 'application/json' }),
        body: JSON.stringify({ version, input }),
        signal
      });
      if (res.status !== 429 || attempt >= maxRetries)
        return this.json<Prediction>(res, 'prediction');
      // Low-credit accounts are throttled to a burst of 1; wait as instructed and retry.
      const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
      const header = Number(res.headers.get('retry-after'));
      const wait = Math.min(
        30,
        Math.max(1, body.retry_after ?? (Number.isFinite(header) ? header : 10))
      );
      await sleep(wait * 1000 * this.retryScale, signal);
    }
  }

  async get(id: string, signal?: AbortSignal): Promise<Prediction> {
    if (!/^[a-z0-9]+$/.test(id)) throw new VocalFixError('Bad prediction id.', 502);
    const res = await this.fetchImpl(API + '/predictions/' + id, {
      headers: this.headers(),
      signal
    });
    return this.json<Prediction>(res, 'status');
  }

  async cancel(id: string): Promise<void> {
    if (!/^[a-z0-9]+$/.test(id)) return;
    await this.fetchImpl(API + '/predictions/' + id + '/cancel', {
      method: 'POST',
      headers: this.headers()
    }).catch(() => undefined);
  }

  /** Poll until terminal; cancels remotely if the job is aborted. */
  async wait(
    prediction: Prediction,
    opts: {
      signal?: AbortSignal;
      intervalMs?: number;
      timeoutMs?: number;
      onStatus?: (s: PredictionStatus) => void;
    } = {}
  ): Promise<Prediction> {
    const deadline = Date.now() + (opts.timeoutMs ?? 15 * 60_000);
    let p = prediction;
    while (p.status === 'starting' || p.status === 'processing') {
      if (opts.signal?.aborted) {
        await this.cancel(p.id);
        throw new VocalFixError('Cancelled.', 409);
      }
      if (Date.now() > deadline) {
        await this.cancel(p.id);
        throw new VocalFixError('Replicate prediction timed out.', 504);
      }
      await new Promise((r) => setTimeout(r, opts.intervalMs ?? 2000));
      p = await this.get(p.id, opts.signal);
      opts.onStatus?.(p.status);
    }
    if (p.status !== 'succeeded')
      throw new VocalFixError(
        'Replicate prediction ' + p.status + ': ' + (p.error ?? 'no detail'),
        502
      );
    return p;
  }

  async download(url: string, maxBytes: number, signal?: AbortSignal): Promise<Uint8Array> {
    if (url.startsWith('data:')) return decodeDataUri(url, maxBytes);
    if (!isAllowedOutputUrl(url)) throw new VocalFixError('Unexpected output host.', 502);
    const res = await this.fetchImpl(url, { signal, redirect: 'error' });
    if (!res.ok) throw new VocalFixError('Output download failed (' + res.status + ').', 502);
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > maxBytes) throw new VocalFixError('Output too large.', 502);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > maxBytes || bytes.byteLength < 64)
      throw new VocalFixError('Output size invalid.', 502);
    return bytes;
  }
}

/** First URL in a model output (string, array or object field). */
export function outputUrl(output: unknown, field?: string): string | null {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return typeof output[0] === 'string' ? output[0] : null;
  if (output && typeof output === 'object' && field) {
    const v = (output as Record<string, unknown>)[field];
    return typeof v === 'string' ? v : null;
  }
  return null;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new VocalFixError('Cancelled.', 409));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new VocalFixError('Cancelled.', 409));
      },
      { once: true }
    );
  });
}

/** Some models (Demucs isolate_stem) return outputs inline as base64 data URIs. */
export function decodeDataUri(uri: string, maxBytes: number): Uint8Array {
  const comma = uri.indexOf(',');
  const head = uri.slice(0, comma);
  if (comma < 0 || !/^data:audio\/[a-z0-9.+-]+;base64$/i.test(head))
    throw new VocalFixError('Unexpected inline output.', 502);
  const b64 = uri.slice(comma + 1);
  if ((b64.length * 3) / 4 > maxBytes) throw new VocalFixError('Output too large.', 502);
  const bytes = new Uint8Array(Buffer.from(b64, 'base64'));
  if (bytes.byteLength < 64) throw new VocalFixError('Output size invalid.', 502);
  return bytes;
}
