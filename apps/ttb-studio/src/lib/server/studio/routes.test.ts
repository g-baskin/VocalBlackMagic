import { afterEach, describe, expect, mock, test } from 'bun:test';
import { join, relative } from 'node:path';

// Route modules import keys from SvelteKit's virtual env module; give them none.
mock.module('$app/env/private', () => ({
  ANTHROPIC_API_KEY: undefined,
  ELEVENLABS_API_KEY: undefined,
  FAL_KEY: undefined,
  GEMINI_API_KEY: undefined,
  MINIMAX_API_KEY: undefined,
  OPENAI_API_KEY: undefined,
  REPLICATE_API_TOKEN: undefined,
  VBM_ENGINE_TOKEN: undefined,
  VBM_ENGINE_URL: undefined
}));

type Handler = (event: unknown) => Promise<Response> | Response;
const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const;
const WRITES = new Set(['POST', 'PATCH', 'PUT']);
// Read-only capability report; documented in AGENTS.md as having no dev gate or Host check.
const UNGUARDED = new Set(['capabilities/+server.ts GET']);

const routesDir = join(import.meta.dir, '../../../routes/api/studio');
const realEnv = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = realEnv;
});

async function handlers(): Promise<{ name: string; method: string; run: Handler }[]> {
  const out: { name: string; method: string; run: Handler }[] = [];
  for await (const file of new Bun.Glob('**/+server.ts').scan(routesDir)) {
    const mod = (await import(join(routesDir, file))) as Record<string, Handler>;
    for (const method of METHODS)
      if (typeof mod[method] === 'function')
        out.push({ name: `${relative('.', file)} ${method}`, method, run: mod[method] });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function call(run: Handler, method: string, host: string, contentType = 'application/json') {
  const calls: string[] = [];
  const fetcher = (async (input: string | URL | Request) => {
    calls.push(String(input));
    return new Response('no network in tests', { status: 599 });
  }) as unknown as typeof fetch;
  const url = new URL(`http://${host}/api/studio/songs/s1?which=a`);
  const request = new Request(url, {
    method,
    headers: { host, 'content-type': contentType },
    body: WRITES.has(method) ? '{}' : undefined
  });
  const event = { request, url, params: { id: 's1' }, fetch: fetcher };
  return Promise.resolve(run(event)).then((res) => ({ res, calls }));
}

describe('every /api/studio route is behind guard()', () => {
  // Regression guard: a route that forgets guard() would spend money with no dev gate or Host check.
  test('the route table is the expected one', async () => {
    const all = await handlers();
    expect(all.length).toBeGreaterThanOrEqual(34);
    for (const name of [
      'sounds/+server.ts GET',
      'sounds/[id]/+server.ts DELETE',
      'sounds/[id]/+server.ts PATCH',
      'sounds/[id]/audio/+server.ts GET',
      'sounds/slice/+server.ts POST',
      'sounds/upload/+server.ts POST',
      'kits/+server.ts POST',
      'kits/[id]/+server.ts PUT',
      'kits/[id]/+server.ts DELETE'
    ])
      expect(all.map((h) => h.name)).toContain(name);
    for (const name of UNGUARDED) expect(all.map((h) => h.name)).toContain(name);
  });

  test('outside development every guarded route answers 403 before any provider call', async () => {
    process.env.NODE_ENV = 'production';
    for (const h of await handlers()) {
      if (UNGUARDED.has(h.name)) continue;
      const { res, calls } = await call(h.run, h.method, 'localhost:5174');
      expect([h.name, res.status]).toEqual([h.name, 403]);
      expect(calls).toEqual([]);
    }
  });

  test('in development a foreign Host header is refused on every guarded route', async () => {
    process.env.NODE_ENV = 'development';
    for (const h of await handlers()) {
      if (UNGUARDED.has(h.name)) continue;
      const { res, calls } = await call(h.run, h.method, 'attacker.example');
      expect([h.name, res.status]).toEqual([h.name, 403]);
      expect((await res.json()).detail).toBe('The studio only answers on localhost.');
      expect(calls).toEqual([]);
    }
  });

  test('in development every write refuses a non-JSON body', async () => {
    process.env.NODE_ENV = 'development';
    for (const h of await handlers()) {
      if (UNGUARDED.has(h.name) || !WRITES.has(h.method)) continue;
      const { res, calls } = await call(h.run, h.method, '127.0.0.1:5174', 'text/plain');
      expect([h.name, res.status]).toEqual([h.name, 415]);
      expect(calls).toEqual([]);
    }
  });
});

describe('guard()', () => {
  test('dev gate, loopback hosts and JSON-only writes', async () => {
    const { guard } = await import('./context');
    const req = (host: string, type = 'application/json') =>
      new Request('http://x/', { method: 'POST', headers: { host, 'content-type': type } });
    process.env.NODE_ENV = 'production';
    expect(guard(req('localhost'), false)?.status).toBe(403);
    process.env.NODE_ENV = 'development';
    for (const host of ['localhost', 'localhost:5174', '127.0.0.1:5174', '[::1]:5174'])
      expect(guard(req(host), true)).toBeNull();
    for (const host of ['evil.example', 'localhost.evil.example', '10.0.0.5', ''])
      expect(guard(req(host), false)?.status).toBe(403);
    expect(guard(req('localhost', 'text/plain'), true)?.status).toBe(415);
    expect(guard(req('localhost', 'application/json; charset=utf-8'), true)).toBeNull();
    expect(guard(req('localhost', 'text/plain'), false)).toBeNull();
    // Raw uploads need the intent header a cross-site form cannot send.
    expect(guard(req('localhost', 'audio/wav'), 'intent')?.status).toBe(415);
    const upload = new Request('http://x/', {
      method: 'POST',
      headers: { host: 'localhost', 'content-type': 'audio/wav', 'x-vbm-intent': 'sound-upload' }
    });
    expect(guard(upload, 'intent')).toBeNull();
    expect(guard(upload, true)?.status).toBe(415);
  });
});
