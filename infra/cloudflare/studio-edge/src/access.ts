// Verifies the Cloudflare Access login token (a signed JWT) that Access attaches to every request.
// Fail closed: anything unexpected means "not signed in".

export type AccessConfig = {
  /** Zero Trust team name or domain, e.g. "myteam" or "myteam.cloudflareaccess.com". */
  teamDomain: string;
  /** Application Audience (AUD) tag of the Access application protecting this Worker. */
  audience: string;
  /** Lower-case email addresses allowed in. */
  allowedEmails: string[];
};

export type AccessIdentity = { email: string };

type Jwk = JsonWebKey & { kid?: string };
type CertCache = { url: string; keys: Jwk[]; fetchedAt: number };

const CERT_TTL_MS = 60 * 60 * 1000;
const CLOCK_SKEW_S = 60;
let certCache: CertCache | null = null;

export function resetCertCache(): void {
  certCache = null;
}

export function teamOrigin(teamDomain: string): string {
  const name = teamDomain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  const host = name.includes('.') ? name : `${name}.cloudflareaccess.com`;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)) throw new Error('bad team domain');
  return `https://${host.toLowerCase()}`;
}

function b64urlToBytes(part: string): Uint8Array<ArrayBuffer> {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJson(part: string): Record<string, unknown> {
  const value: unknown = JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('bad json');
  return value as Record<string, unknown>;
}

async function signingKeys(origin: string, fetcher: typeof fetch, now: number): Promise<Jwk[]> {
  const url = `${origin}/cdn-cgi/access/certs`;
  if (certCache && certCache.url === url && now - certCache.fetchedAt < CERT_TTL_MS)
    return certCache.keys;
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`certs ${response.status}`);
  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  certCache = { url, keys, fetchedAt: now };
  return keys;
}

/** Returns the signed-in identity, or null when the token is missing, invalid or not allowed. */
export async function verifyAccessToken(
  token: string | null,
  config: AccessConfig,
  fetcher: typeof fetch = fetch,
  nowMs: number = Date.now()
): Promise<AccessIdentity | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = decodeJson(parts[0]);
    const payload = decodeJson(parts[1]);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

    const origin = teamOrigin(config.teamDomain);
    let keys = await signingKeys(origin, fetcher, nowMs);
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      // Access rotates keys; refetch once before giving up.
      certCache = null;
      keys = await signingKeys(origin, fetcher, nowMs);
      jwk = keys.find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64urlToBytes(parts[2]),
      signed
    );
    if (!valid) return null;

    const nowS = Math.floor(nowMs / 1000);
    if (payload.iss !== origin) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!config.audience || !aud.includes(config.audience)) return null;
    if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_S < nowS) return null;
    if (typeof payload.nbf === 'number' && payload.nbf - CLOCK_SKEW_S > nowS) return null;
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    if (!email || !config.allowedEmails.includes(email)) return null;
    return { email };
  } catch {
    return null;
  }
}
