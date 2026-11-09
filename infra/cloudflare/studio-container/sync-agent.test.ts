import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  decodeKey,
  defaultConfig,
  encodeKey,
  flush,
  isSkipped,
  isValidKey,
  newState,
  plan,
  restore,
  runCycle,
  seedState,
  type SyncConfig
} from './sync-agent';

/** In-memory fake of the Worker R2 outbound handler. */
function fakeR2(opts: { failList?: boolean; pageSize?: number } = {}) {
  const store = new Map<string, Uint8Array>();
  const calls: string[] = [];
  const fetchFn = async (input: string, init?: RequestInit): Promise<Response> => {
    const url = new URL(input);
    const method = init?.method ?? 'GET';
    calls.push(method + ' ' + url.pathname);
    if (url.pathname === '/list') {
      if (opts.failList) return new Response('boom', { status: 500 });
      const prefix = url.searchParams.get('prefix') ?? '';
      const start = Number(url.searchParams.get('cursor') ?? '0');
      const keys = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      const size = opts.pageSize ?? 1000;
      const page = keys.slice(start, start + size);
      const next = start + size < keys.length ? String(start + size) : undefined;
      return Response.json({
        objects: page.map((key) => ({
          key,
          size: store.get(key)!.length,
          etag: 'e',
          uploaded: ''
        })),
        ...(next ? { cursor: next } : {})
      });
    }
    const key = decodeKey(url.pathname.slice('/o/'.length));
    if (method === 'GET') {
      const v = store.get(key);
      return v ? new Response(v as Uint8Array<ArrayBuffer>) : new Response(null, { status: 404 });
    }
    if (method === 'PUT') {
      store.set(key, new Uint8Array(await new Response(init!.body).arrayBuffer()));
      return new Response(null, { status: 204 });
    }
    if (method === 'DELETE') {
      store.delete(key);
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 405 });
  };
  return { store, calls, fetchFn };
}

let dir: string;
const logs: string[] = [];
const cfgFor = (fetchFn: SyncConfig['fetch'], dataDir = dir): SyncConfig =>
  defaultConfig({
    dataDir,
    baseUrl: 'http://r2.test',
    fetch: fetchFn,
    log: (l) => logs.push(l),
    retryDelayMs: 1,
    retries: 2
  });
const enc = (s: string) => new TextEncoder().encode(s);
async function put(rel: string, body: string) {
  await mkdir(path.dirname(path.join(dir, rel)), { recursive: true });
  await writeFile(path.join(dir, rel), body);
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'vbm-sync-'));
  logs.length = 0;
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('keys', () => {
  test('encoding round-trips names with spaces', async () => {
    const key = 'studio/songs/a b/My Song 01.flac';
    expect(encodeKey(key)).toBe('studio/songs/a%20b/My%20Song%2001.flac');
    expect(decodeKey(encodeKey(key))).toBe(key);
    const r2 = fakeR2();
    await put(key, 'audio');
    const cfg = cfgFor(r2.fetchFn);
    const state = newState();
    await runCycle(cfg, state);
    await runCycle(cfg, state);
    expect(new TextDecoder().decode(r2.store.get(key))).toBe('audio');
  });
  test('validation and skip rules', () => {
    expect(isValidKey('studio/jobs/x.json')).toBe(true);
    expect(isValidKey('a/../b')).toBe(false);
    expect(isValidKey('é.flac')).toBe(false);
    expect(isValidKey('x'.repeat(513))).toBe(false);
    expect(isSkipped('studio/songs/1/meta.json.tmp')).toBe(true);
    expect(isSkipped('studio/songs/1/originals/decoded-0.flac')).toBe(true);
    expect(isSkipped('studio/.hidden/x')).toBe(true);
    expect(isSkipped('x.partial')).toBe(true);
    expect(isSkipped('studio/songs/1/meta.json')).toBe(false);
  });
});

describe('restore', () => {
  test('downloads missing/different and skips identical, paginating', async () => {
    const r2 = fakeR2({ pageSize: 1 });
    r2.store.set('studio/songs/1/meta.json', enc('{"a":1}'));
    r2.store.set('studio/songs/1/audio.flac', enc('AUDIO'));
    r2.store.set('shared/voices/v 1.json', enc('v'));
    await put('studio/songs/1/meta.json', '{"a":1}'); // identical size
    await put('studio/songs/1/audio.flac', 'OLD'); // differs
    const r = await restore(cfgFor(r2.fetchFn));
    expect(r).toEqual({ downloaded: 2, skipped: 1, invalid: 0 });
    expect(await readFile(path.join(dir, 'studio/songs/1/audio.flac'), 'utf8')).toBe('AUDIO');
    expect(await readFile(path.join(dir, 'shared/voices/v 1.json'), 'utf8')).toBe('v');
    expect(r2.calls.filter((c) => c.startsWith('GET /o/')).length).toBe(2);
  });
  test('throws when listing fails', async () => {
    const r2 = fakeR2({ failList: true });
    await expect(restore(cfgFor(r2.fetchFn))).rejects.toThrow(/list/);
  });
  test('throws when a download fails', async () => {
    const r2 = fakeR2();
    r2.store.set('a.json', enc('x'));
    const bad = async (u: string, i?: RequestInit) =>
      u.includes('/o/') ? new Response(null, { status: 500 }) : r2.fetchFn(u, i);
    await expect(restore(cfgFor(bad))).rejects.toThrow(/get a.json/);
  });
});

describe('run cycle', () => {
  test('uploads stable changes but preserves remotely stored files removed locally', async () => {
    const r2 = fakeR2();
    const cfg = cfgFor(r2.fetchFn);
    const state = newState();
    await put('studio/songs/1/meta.json', 'm1');
    await put('studio/songs/1/meta.json.tmp', 'tmp');
    await put('studio/jobs/j.json.tmp', 'tmp');
    await put('studio/songs/1/originals/decoded-0.flac', 'tmp');
    await put('.hidden', 'x');
    await put('studio/x.partial', 'x');
    let r = await runCycle(cfg, state);
    expect(r.uploaded).toBe(0); // first sight: not yet stable
    expect(r.pending).toBe(1);
    r = await runCycle(cfg, state);
    expect(r.uploaded).toBe(1);
    expect([...r2.store.keys()]).toEqual(['studio/songs/1/meta.json']);

    // change
    await put('studio/songs/1/meta.json', 'm2-longer');
    await runCycle(cfg, state);
    await runCycle(cfg, state);
    expect(new TextDecoder().decode(r2.store.get('studio/songs/1/meta.json'))).toBe('m2-longer');

    // delete (keep another file so the dir is non-empty)
    await put('studio/lyrics/l.json', 'l');
    await rm(path.join(dir, 'studio/songs/1/meta.json'));
    await runCycle(cfg, state);
    r = await runCycle(cfg, state);
    expect(r2.store.has('studio/songs/1/meta.json')).toBe(true);
    expect(r.deleted).toBe(0);
    expect(r2.calls.some((c) => c.startsWith('DELETE'))).toBe(false);
    expect(r2.store.has('studio/lyrics/l.json')).toBe(true);
  });

  test('partial local scan must not infer remote deletion, including previously synced songs', async () => {
    const r2 = fakeR2();
    const song = 'studio/songs/1/audio.flac';
    r2.store.set(song, enc('ORIGINAL'));
    await put('studio/jobs/j.json', 'job');
    const cfg = cfgFor(r2.fetchFn);
    const state = newState();
    await seedState(cfg, state);
    const local = new Map([['studio/jobs/j.json', { size: 3, mtimeMs: 1 }]]);
    expect(plan(state, local).deletes).toEqual([]);
    state.index.set(song, { size: 8, mtimeMs: 1 });
    expect(plan(state, local, { requireStable: false }).deletes).toEqual([]);
    await runCycle(cfg, state);
    await runCycle(cfg, state);
    expect(new TextDecoder().decode(r2.store.get(song))).toBe('ORIGINAL');
    expect(r2.calls.some((c) => c.startsWith('DELETE'))).toBe(false);
  });

  test('does not upload a still-growing file', async () => {
    const r2 = fakeR2();
    const cfg = cfgFor(r2.fetchFn);
    const state = newState();
    for (let i = 1; i <= 3; i++) {
      await put('studio/songs/2/audio.flac', 'x'.repeat(i * 10));
      const r = await runCycle(cfg, state);
      expect(r.uploaded).toBe(0);
    }
    expect(r2.store.size).toBe(0);
    // mtime-only change also counts as unstable
    const f = path.join(dir, 'studio/songs/2/audio.flac');
    await utimes(f, new Date(), new Date(Date.now() + 5000));
    expect((await runCycle(cfg, state)).uploaded).toBe(0);
    expect((await runCycle(cfg, state)).uploaded).toBe(1);
  });

  test('never deletes remote keys when the data dir is missing or empty', async () => {
    const r2 = fakeR2();
    r2.store.set('studio/songs/1/meta.json', enc('m'));
    r2.store.set('studio/jobs/j.json', enc('j'));
    const missing = path.join(dir, 'nope');
    const state = newState();
    await seedState(cfgFor(r2.fetchFn, missing), state);
    expect(state.remote.size).toBe(2);
    const r = await runCycle(cfgFor(r2.fetchFn, missing), state);
    expect(r.scanFailed).toBe(true);
    expect(r2.store.size).toBe(2);
    // empty (e.g. unmounted) dir: also no deletes
    await runCycle(cfgFor(r2.fetchFn, dir), state);
    expect(r2.store.size).toBe(2);
    expect(r2.calls.some((c) => c.startsWith('DELETE'))).toBe(false);
  });

  test('one failing upload does not stop others', async () => {
    const r2 = fakeR2();
    const flaky = async (u: string, i?: RequestInit) =>
      u.includes('bad') ? new Response(null, { status: 503 }) : r2.fetchFn(u, i);
    const cfg = cfgFor(flaky);
    const state = newState();
    await put('bad.json', 'b');
    await put('good.json', 'g');
    await runCycle(cfg, state);
    const r = await runCycle(cfg, state);
    expect(r.failed).toBe(1);
    expect(r.uploaded).toBe(1);
    expect(r2.store.has('good.json')).toBe(true);
  });
});

describe('flush (SIGTERM path)', () => {
  test('uploads new files during shutdown without deleting remote-only objects', async () => {
    const r2 = fakeR2();
    r2.store.set('gone.json', enc('g'));
    const cfg = cfgFor(r2.fetchFn);
    const state = newState();
    await seedState(cfg, state);
    await put('studio/songs/3/audio.flac', 'fresh');
    const r = await flush(cfg, state, { budgetMs: 5000, settleMs: 20 });
    expect(r.uploaded).toBe(1);
    expect(r.deleted).toBe(0);
    expect(r2.store.has('studio/songs/3/audio.flac')).toBe(true);
    expect(r2.store.has('gone.json')).toBe(true);
    expect(r2.calls.some((c) => c.startsWith('DELETE'))).toBe(false);
  });
});
