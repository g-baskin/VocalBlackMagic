// Worker side of the studio sync agent (infra/cloudflare/studio-container/sync-agent.ts).
// The container talks plain HTTP to host r2.vbm; the Container class intercepts that host and
// answers here from the R2 bucket. Every key is stored under DATA_PREFIX.

/** The slice of the R2 bucket binding this module uses (kept small so tests can fake it). */
export interface R2Like {
  list(options: { prefix: string; cursor?: string; limit?: number }): Promise<{
    objects: { key: string; size: number; etag: string; uploaded: Date }[];
    truncated: boolean;
    cursor?: string;
  }>;
  get(key: string): Promise<{ body: ReadableStream; size: number; etag: string } | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string | null): Promise<unknown>;
  delete(key: string): Promise<void>;
}

export const DATA_PREFIX = 'data/';
const PAGE_SIZE = 1000;
const MAX_KEY = 512;
const KEY_CHARS = /^[A-Za-z0-9._\-/ ]+$/;

/** Returns the validated relative key, or null when it is unsafe. */
export function validKey(raw: string, allowEmpty = false): string | null {
  let key: string;
  try {
    key = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (key === '') return allowEmpty ? '' : null;
  if (key.length > MAX_KEY || !KEY_CHARS.test(key)) return null;
  if (key.startsWith('/') || key.includes('\\')) return null;
  if (key.split('/').some((segment) => segment === '..')) return null;
  return key;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

const empty = (status: number) => new Response(null, { status });

type FixedLengthCtor = new (length: number) => TransformStream<Uint8Array, Uint8Array>;

/**
 * R2 only streams bodies of known length. With a Content-Length, stream through the Workers
 * FixedLengthStream; without one, buffer the body (the sync agent normally sends the length).
 */
function uploadBody(request: Request): ReadableStream | Promise<ArrayBuffer> | string {
  if (!request.body) return '';
  const length = Number(request.headers.get('content-length'));
  const Fixed = (globalThis as { FixedLengthStream?: FixedLengthCtor }).FixedLengthStream;
  if (Fixed && Number.isSafeInteger(length) && length >= 0 && request.headers.has('content-length'))
    return request.body.pipeThrough(new Fixed(length));
  return request.arrayBuffer();
}

export async function handleR2(request: Request, bucket: R2Like): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/list') {
    if (request.method !== 'GET') return empty(405);
    const prefix = validKey(url.searchParams.get('prefix') ?? '', true);
    if (prefix === null) return empty(400);
    const cursor = url.searchParams.get('cursor') || undefined;
    const page = await bucket.list({ prefix: DATA_PREFIX + prefix, cursor, limit: PAGE_SIZE });
    return json(200, {
      objects: page.objects.map((o) => ({
        key: o.key.slice(DATA_PREFIX.length),
        size: o.size,
        etag: o.etag,
        uploaded: o.uploaded.toISOString()
      })),
      ...(page.truncated && page.cursor ? { cursor: page.cursor } : {})
    });
  }

  if (!path.startsWith('/o/')) return empty(404);
  const key = validKey(path.slice('/o/'.length));
  if (key === null) return empty(400);
  const full = DATA_PREFIX + key;

  switch (request.method) {
    case 'GET': {
      const object = await bucket.get(full);
      if (!object) return empty(404);
      return new Response(object.body, {
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': String(object.size),
          etag: object.etag
        }
      });
    }
    case 'PUT':
      await bucket.put(full, await uploadBody(request));
      return empty(204);
    case 'DELETE':
      await bucket.delete(full);
      return empty(204);
    default:
      return empty(405);
  }
}
