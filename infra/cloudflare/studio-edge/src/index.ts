// VBM Studio edge Worker: lets only the owner in (Cloudflare Access login + email allowlist),
// then forwards the request to the studio Container (see worker.ts for the binding).
import { verifyAccessToken, type AccessConfig } from './access';

export type Fetcher = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

export interface Env {
  /** Reaches the studio server (the Container instance, wired up in worker.ts). */
  STUDIO: Fetcher;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  /** Comma-separated owner emails. */
  OWNER_EMAILS: string;
  /** Studio origin inside the container, e.g. http://localhost:3002. */
  ORIGIN_URL: string;
  /** Shared secret the studio checks in owner mode (wrangler secret put EDGE_SECRET). */
  EDGE_SECRET: string;
  /** Path prefix served by Vocal Fix (built with the same base), e.g. /vocal-fix. Optional. */
  VOCAL_FIX_BASE?: string;
  /** Vocal Fix origin inside the container, e.g. http://localhost:3001. Optional. */
  VOCAL_FIX_ORIGIN_URL?: string;
}

/** Headers only this Worker may set; anything a client sends under these names is dropped. */
export const EDGE_HEADERS = ['x-vbm-edge-auth', 'x-vbm-owner-email', 'cf-container-target-port'];
const MIN_SECRET_LENGTH = 32;

const securityHeaders: Record<string, string> = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(self)'
};

type Config = AccessConfig & {
  origin: URL;
  secret: string;
  vocalFix: { base: string; origin: URL } | null;
};

function httpOrigin(raw: string | undefined): URL | null {
  try {
    const url = new URL(raw ?? '');
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** Vocal Fix routing is on only when both values are valid; a bad value fails closed (503). */
function vocalFixConfig(env: Env): Config['vocalFix'] | undefined {
  const base = (env.VOCAL_FIX_BASE ?? '').trim();
  if (!base && !env.VOCAL_FIX_ORIGIN_URL) return null;
  const origin = httpOrigin(env.VOCAL_FIX_ORIGIN_URL);
  if (!origin || !/^\/[A-Za-z0-9_~-][A-Za-z0-9._~-]*$/.test(base)) return undefined;
  return { base, origin };
}

/** True when the pathname belongs to the app served under `base` (exact or below it). */
export function underBase(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + '/');
}

function config(env: Env): Config | null {
  const allowedEmails = (env.OWNER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const secret = env.EDGE_SECRET ?? '';
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || allowedEmails.length === 0) return null;
  if (secret.length < MIN_SECRET_LENGTH || !env.STUDIO) return null;
  const origin = httpOrigin(env.ORIGIN_URL);
  if (!origin) return null;
  const vocalFix = vocalFixConfig(env);
  if (vocalFix === undefined) return null;
  return {
    teamDomain: env.ACCESS_TEAM_DOMAIN,
    audience: env.ACCESS_AUD,
    allowedEmails,
    origin,
    secret,
    vocalFix
  };
}

function plain(status: number, text: string): Response {
  return withSecurity(
    new Response(text, {
      status,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
    }),
    false
  );
}

function withSecurity(response: Response, isApi: boolean): Response {
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(securityHeaders)) out.headers.set(name, value);
  if (isApi) out.headers.set('cache-control', 'no-store');
  return out;
}

function cookieToken(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

export async function handle(
  request: Request,
  env: Env,
  fetcher: typeof fetch = fetch
): Promise<Response> {
  const cfg = config(env);
  if (!cfg) return plain(503, 'VBM Studio is not configured yet.');

  const token = request.headers.get('cf-access-jwt-assertion') ?? cookieToken(request);
  const identity = await verifyAccessToken(token, cfg, fetcher);
  if (!identity)
    return plain(403, 'Sign in with your Cloudflare Access account to use VBM Studio.');

  const url = new URL(request.url);
  // /vocal-fix/... goes to Vocal Fix (built with that base path); everything else to the studio.
  const vf = cfg.vocalFix && underBase(url.pathname, cfg.vocalFix.base) ? cfg.vocalFix : null;
  const upstreamOrigin = vf ? vf.origin : cfg.origin;
  const target = new URL(url.pathname + url.search, upstreamOrigin);
  const headers = new Headers(request.headers);
  for (const name of EDGE_HEADERS) headers.delete(name);
  headers.delete('cf-access-jwt-assertion');
  headers.set('host', upstreamOrigin.host);
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
  headers.set('x-vbm-edge-auth', cfg.secret);
  headers.set('x-vbm-owner-email', identity.email);
  // SvelteKit's CSRF check compares Origin with the server's own origin; rewrite same-site origins.
  const origin = request.headers.get('origin');
  if (origin && origin === url.origin) headers.set('origin', upstreamOrigin.origin);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstream: Response;
  try {
    upstream = await env.STUDIO.fetch(
      new Request(target, {
        method: request.method,
        headers,
        body: hasBody ? request.body : undefined,
        redirect: 'manual'
      })
    );
  } catch {
    return plain(502, 'The studio is starting or unavailable. Try again in a minute.');
  }

  let response = upstream;
  const location = upstream.headers.get('location');
  if (location) {
    // Keep redirects on the public address instead of leaking the internal origin.
    // Relative locations (SvelteKit sends ./x with relative paths) resolve against the request.
    const resolved = new URL(location, target);
    if (resolved.origin === upstreamOrigin.origin) {
      response = new Response(upstream.body, upstream);
      response.headers.set('location', resolved.pathname + resolved.search + resolved.hash);
    }
  }
  const apiPrefix = (vf ? vf.base : '') + '/api/';
  return withSecurity(response, url.pathname.startsWith(apiPrefix));
}
