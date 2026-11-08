import { describe, expect, test } from 'bun:test';
import { handleR2, validKey, type R2Like } from './r2-store';

function fakeBucket() {
  const store = new Map<string, { data: Uint8Array; uploaded: Date }>();
  const bucket: R2Like = {
    async list({ prefix, cursor, limit = 1000 }) {
      const keys = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const slice = keys.slice(start, start + limit);
      const truncated = start + limit < keys.length;
      return {
        objects: slice.map((key) => ({
          key,
          size: store.get(key)!.data.length,
          etag: 'e-' + key,
          uploaded: store.get(key)!.uploaded
        })),
        truncated,
        cursor: truncated ? String(start + limit) : undefined
      };
    },
    async get(key) {
      const hit = store.get(key);
      if (!hit) return null;
      return { body: new Blob([hit.data]).stream(), size: hit.data.length, etag: 'e-' + key };
    },
    async put(key, value) {
      const data = new Uint8Array(await new Response(value).arrayBuffer());
      store.set(key, { data, uploaded: new Date(0) });
    },
    async delete(key) {
      store.delete(key);
    }
  };
  return { bucket, store };
}

const req = (method: string, path: string, body?: string) =>
  new Request('http://r2.vbm' + path, { method, body });

describe('r2 store', () => {
  test('put, get, list and delete under the data/ prefix', async () => {
    const { bucket, store } = fakeBucket();
    expect(
      (await handleR2(req('PUT', '/o/studio/songs/a%20b/meta.json', '{"x":1}'), bucket)).status
    ).toBe(204);
    expect([...store.keys()]).toEqual(['data/studio/songs/a b/meta.json']);

    const got = await handleR2(req('GET', '/o/studio/songs/a%20b/meta.json'), bucket);
    expect(got.status).toBe(200);
    expect(await got.text()).toBe('{"x":1}');

    const list = await handleR2(req('GET', '/list?prefix=studio/'), bucket);
    expect(await list.json()).toEqual({
      objects: [
        {
          key: 'studio/songs/a b/meta.json',
          size: 7,
          etag: 'e-data/studio/songs/a b/meta.json',
          uploaded: new Date(0).toISOString()
        }
      ]
    });

    expect((await handleR2(req('DELETE', '/o/studio/songs/a%20b/meta.json'), bucket)).status).toBe(
      204
    );
    expect((await handleR2(req('GET', '/o/studio/songs/a%20b/meta.json'), bucket)).status).toBe(
      404
    );
  });

  test('list pages with a cursor', async () => {
    const { bucket, store } = fakeBucket();
    for (let i = 0; i < 1001; i++)
      store.set(`data/k${String(i).padStart(4, '0')}`, {
        data: new Uint8Array(),
        uploaded: new Date(0)
      });
    const first = (await (await handleR2(req('GET', '/list'), bucket)).json()) as {
      objects: unknown[];
      cursor?: string;
    };
    expect(first.objects.length).toBe(1000);
    expect(first.cursor).toBe('1000');
    const second = (await (await handleR2(req('GET', '/list?cursor=1000'), bucket)).json()) as {
      objects: { key: string }[];
      cursor?: string;
    };
    expect(second.objects.map((o) => o.key)).toEqual(['k1000']);
    expect(second.cursor).toBeUndefined();
  });

  test('rejects unsafe keys with 400', async () => {
    const { bucket } = fakeBucket();
    for (const path of [
      '/o/a%2F..%2Fb',
      '/o/%2Fetc',
      '/o/a%5Cb',
      '/o/a%00b',
      '/o/',
      '/o/a$b',
      '/o/' + 'a'.repeat(513),
      '/o/%E0%A4%A'
    ])
      expect((await handleR2(req('GET', path), bucket)).status).toBe(400);
    expect((await handleR2(req('GET', '/list?prefix=../'), bucket)).status).toBe(400);
    // A literal ../ is resolved away by URL parsing and never reaches the bucket.
    expect((await handleR2(req('GET', '/o/../x'), bucket)).status).toBe(404);
    expect(validKey('../x')).toBeNull();
    expect(validKey('a'.repeat(512))).toBe('a'.repeat(512));
  });

  test('unknown paths are 404 and other methods 405', async () => {
    const { bucket } = fakeBucket();
    expect((await handleR2(req('GET', '/other'), bucket)).status).toBe(404);
    expect((await handleR2(req('POST', '/o/a'), bucket)).status).toBe(405);
    expect((await handleR2(req('POST', '/list'), bucket)).status).toBe(405);
  });
});
