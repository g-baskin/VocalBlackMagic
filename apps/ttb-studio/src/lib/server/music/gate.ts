import { createHash, timingSafeEqual } from 'node:crypto';

/** Edge secrets shorter than this are ignored, so owner mode cannot run on a guessable secret. */
export const MIN_EDGE_SECRET_LENGTH = 32;

/**
 * Owner mode: the studio runs as a production build on the owner's own computer and is reached
 * only through the VBM Studio edge Worker (infra/cloudflare), which admits the owner after a
 * Cloudflare Access login and adds the shared edge secret. A request without that secret is
 * treated exactly like any other production request.
 */
export function isOwnerEdgeRequest(request: Request | undefined): boolean {
  if (!request || process.env.VBM_OWNER_MODE !== '1') return false;
  const secret = process.env.VBM_EDGE_SECRET?.trim() ?? '';
  if (secret.length < MIN_EDGE_SECRET_LENGTH) return false;
  const supplied = request.headers.get('x-vbm-edge-auth') ?? '';
  if (!supplied) return false;
  const a = createHash('sha256').update(supplied).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}

export function generationAllowed(request?: Request): boolean {
  // No multi-user identity, tenant scoping or spending caps yet: hosted generation stays
  // development-only, except for the single owner coming through the authenticated edge Worker.
  return process.env.NODE_ENV === 'development' || isOwnerEdgeRequest(request);
}

export function generationDisabledResponse(request?: Request): Response | null {
  if (generationAllowed(request)) return null;
  return Response.json(
    { detail: 'Song generation is disabled pending authentication, billing and spending caps.' },
    { status: 403 }
  );
}

export function configuredKey(value: string | undefined): string | null {
  const key = value?.trim();
  return key ? key : null;
}

// Paid requests must be JSON so a cross-site text/plain or form POST cannot spend credit.
export function isJsonRequest(request: Request): boolean {
  return (
    (request.headers.get('content-type') ?? '').toLowerCase().split(';')[0].trim() ===
    'application/json'
  );
}
