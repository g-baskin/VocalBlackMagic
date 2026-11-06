export function processingAllowed(): boolean {
  // No user identity, tenant scoping or spending caps yet: processing stays development-only.
  return process.env.NODE_ENV === 'development';
}

export function disabledResponse(): Response | null {
  if (processingAllowed()) return null;
  return Response.json(
    { detail: 'Vocal Fix processing is disabled pending authentication, tenancy and billing.' },
    { status: 403 }
  );
}

export function isJsonRequest(request: Request): boolean {
  return (
    (request.headers.get('content-type') ?? '').toLowerCase().split(';')[0].trim() ===
    'application/json'
  );
}

/** Custom header a cross-site form cannot set without a CORS preflight. */
export const INTENT_HEADER = 'x-vbm-intent';

export function hasIntent(request: Request): boolean {
  return (request.headers.get(INTENT_HEADER) ?? '').trim().length > 0;
}

export function jsonError(detail: string, status: number): Response {
  return Response.json({ detail }, { status, headers: { 'cache-control': 'no-store' } });
}

/** Gate for every state-changing route: dev-only plus a non-simple request. */
export function guardMutation(request: Request, opts: { json: boolean }): Response | null {
  const foreign = hostGuard(request);
  if (foreign) return foreign;
  const disabled = disabledResponse();
  if (disabled) return disabled;
  if (opts.json ? !isJsonRequest(request) : !hasIntent(request))
    return jsonError(
      opts.json ? 'Send application/json.' : 'Missing ' + INTENT_HEADER + ' header.',
      415
    );
  return null;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Read a request body with a hard byte cap enforced while streaming; null when it exceeds the cap. */
export async function readCapped(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > maxBytes) return null;
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

/** DNS-rebinding guard: only loopback host names (any port) may reach the dev server. */
export function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const name = host.trim().toLowerCase();
  const bare = name.startsWith('[') ? name.slice(0, name.indexOf(']') + 1) : name.split(':')[0];
  return bare === 'localhost' || bare === '127.0.0.1' || bare === '[::1]';
}

export function hostGuard(request: Request): Response | null {
  return isLocalHost(request.headers.get('host'))
    ? null
    : jsonError('Vocal Fix only answers on localhost.', 403);
}
