import { beforeEach, describe, expect, test } from 'bun:test';
import { resetCertCache } from './access';
import { handle, type Env } from './index';

const TEAM = 'vbmteam';
const ISS = 'https://vbmteam.cloudflareaccess.com';
const AUD = 'aud-tag-123';
const SECRET = 's'.repeat(40);
const nowS = () => Math.floor(Date.now() / 1000);

const pair = (await crypto.subtle.generateKey(
  {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256'
  },
  true,
  ['sign', 'verify']
)) as CryptoKeyPair;
const otherPair = (await crypto.subtle.generateKey(
  {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256'
  },
  true,
  ['sign', 'verify']
)) as CryptoKeyPair;
const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1' };

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const enc = (value: unknown) => b64url(new TextEncoder().encode(JSON.stringify(value)));

async function sign(claims: Record<string, unknown>, key = pair.privateKey, kid = 'k1') {
  const head = enc({ alg: 'RS256', kid, typ: 'JWT' });
  const body = enc(claims);
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`))
  );
  return `${head}.${body}.${b64url(sig)}`;
}

const goodClaims = () => ({
  iss: ISS,
  aud: [AUD],
  email: 'Owner@Example.com',
  exp: nowS() + 600,
  nbf: nowS() - 10
});

let certFetches = 0;
const certFetch = (async (input: RequestInfo | URL) => {
  certFetches++;
  expect(String(input)).toBe(`${ISS}/cdn-cgi/access/certs`);
  return Response.json({ keys: [jwk] });
}) as typeof fetch;

let seen: Request | null = null;
function env(overrides: Partial<Env> = {}): Env {
  return {
    STUDIO: {
      async fetch(input) {
        seen = input as Request;
        return new Response('studio says hi', {
          headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=60' }
        });
      }
    },
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    OWNER_EMAILS: 'owner@example.com, second@example.com',
    ORIGIN_URL: 'http://localhost:3002',
    EDGE_SECRET: SECRET,
    ...overrides
  };
}

const req = (path: string, token: string | null, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (token) headers.set('cf-access-jwt-assertion', token);
  return new Request(`https://vbm-studio.example.workers.dev${path}`, { ...init, headers });
};

beforeEach(() => {
  resetCertCache();
  seen = null;
  certFetches = 0;
});

describe('studio edge worker', () => {
  test('fails closed when not configured', async () => {
    for (const bad of [
      { ACCESS_AUD: '' },
      { ACCESS_TEAM_DOMAIN: '' },
      { OWNER_EMAILS: ' , ' },
      { EDGE_SECRET: 'short' },
      { ORIGIN_URL: 'not a url' }
    ]) {
      const res = await handle(req('/', await sign(goodClaims())), env(bad), certFetch);
      expect(res.status).toBe(503);
      expect(seen).toBeNull();
    }
  });

  test('refuses requests without a valid Access login', async () => {
    const e = env();
    const cases: (string | null)[] = [
      null,
      'not.a.jwt',
      await sign({ ...goodClaims(), aud: ['other-app'] }),
      await sign({ ...goodClaims(), iss: 'https://evil.cloudflareaccess.com' }),
      await sign({ ...goodClaims(), exp: nowS() - 3600 }),
      await sign({ ...goodClaims(), nbf: nowS() + 3600 }),
      await sign({ ...goodClaims(), email: 'stranger@example.com' }),
      await sign({ ...goodClaims(), email: undefined }),
      await sign(goodClaims(), otherPair.privateKey),
      await sign(goodClaims(), pair.privateKey, 'unknown-kid')
    ];
    for (const token of cases) {
      const res = await handle(req('/api/studio/songs', token), e, certFetch);
      expect(res.status).toBe(403);
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    }
    expect(seen).toBeNull();
  });

  test('forwards the owner to the studio with the edge secret, dropping spoofed headers', async () => {
    const token = await sign(goodClaims());
    const res = await handle(
      req('/api/studio/songs?x=1', token, {
        headers: {
          'x-vbm-edge-auth': 'forged',
          'x-vbm-owner-email': 'forged@example.com',
          origin: 'https://vbm-studio.example.workers.dev'
        }
      }),
      env(),
      certFetch
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('studio says hi');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('strict-transport-security')).toContain('max-age');
    const forwarded = seen as unknown as Request;
    expect(forwarded.url).toBe('http://localhost:3002/api/studio/songs?x=1');
    expect(forwarded.headers.get('x-vbm-edge-auth')).toBe(SECRET);
    expect(forwarded.headers.get('x-vbm-owner-email')).toBe('owner@example.com');
    expect(forwarded.headers.get('cf-access-jwt-assertion')).toBeNull();
    expect(forwarded.headers.get('origin')).toBe('http://localhost:3002');
  });

  test('accepts the CF_Authorization cookie and keeps cross-site origins untouched', async () => {
    const token = await sign(goodClaims());
    const res = await handle(
      req('/', null, {
        method: 'POST',
        body: 'x',
        headers: { cookie: `a=b; CF_Authorization=${token}`, origin: 'https://evil.example' }
      }),
      env(),
      certFetch
    );
    expect(res.status).toBe(200);
    expect((seen as unknown as Request).headers.get('origin')).toBe('https://evil.example');
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
  });

  test('caches signing keys and rewrites origin redirects to the public address', async () => {
    const token = await sign(goodClaims());
    const e = env({
      STUDIO: {
        async fetch() {
          return new Response(null, {
            status: 303,
            headers: { location: 'http://localhost:3002/library?a=1' }
          });
        }
      }
    });
    const first = await handle(req('/', token), e, certFetch);
    await handle(req('/', token), e, certFetch);
    expect(first.status).toBe(303);
    expect(first.headers.get('location')).toBe('/library?a=1');
    expect(certFetches).toBe(1);
  });

  test('reports an unreachable studio clearly', async () => {
    const res = await handle(
      req('/', await sign(goodClaims())),
      env({
        STUDIO: {
          fetch: () => Promise.reject(new Error('tunnel down'))
        }
      }),
      certFetch
    );
    expect(res.status).toBe(502);
  });
});
