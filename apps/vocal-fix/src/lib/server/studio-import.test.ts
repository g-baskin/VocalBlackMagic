import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile, open } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readStudioSource, studioImportResponse } from './studio-import';
import { loadStudioSong } from '../client/studio-import';
import { STUDIO_IMPORT_LIMIT } from '../studio-import';

let root: string;
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'vbm-studio-handoff-test-'));
});
afterAll(async () => {
  await rm(root, { recursive: true });
}); // Only this suite's mkdtemp directory.
async function fixture(audio: Record<string, unknown> = {}) {
  const id = randomUUID();
  const dir = join(root, 'studio', 'songs', id);
  await mkdir(dir, { recursive: true });
  const song = {
    id,
    title: 'Test song',
    audio: { file: 'audio.wav', content_type: 'audio/wav', bytes: 999, ...audio }
  };
  await writeFile(join(dir, 'meta.json'), JSON.stringify(song));
  await writeFile(join(dir, 'audio.wav'), 'synthetic audio fixture');
  return { id, dir, song };
}
async function env<T>(values: Record<string, string>, run: () => Promise<T>): Promise<T> {
  const before = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
const req = (id: string, suffix = '', headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/studio-import/' + id + suffix, {
    headers: { host: 'localhost', ...headers }
  });

describe('private Studio handoff', () => {
  test('returns actual size without modifying the source or creating a session', async () => {
    const f = await fixture();
    const before = await readFile(join(f.dir, 'meta.json'));
    const { source } = await readStudioSource(root, f.id);
    expect(source.bytes).toBe(23);
    expect(source.filename).toBe('Test song.wav');
    expect(await readFile(join(f.dir, 'meta.json'))).toEqual(before);
    expect(await Bun.file(join(root, 'vocal-fix', 'sessions')).exists()).toBe(false);
  });
  test('rejects invalid and missing ids', async () => {
    for (const id of ['../outside', '%2e%2e', 'https://example.com/song', randomUUID()])
      await expect(readStudioSource(root, id)).rejects.toThrow();
  });
  test('rejects paths, symlinks and unsupported formats', async () => {
    const traversal = await fixture({ file: '../outside.wav' });
    await expect(readStudioSource(root, traversal.id)).rejects.toThrow('Invalid Studio audio file');
    const target = join(root, 'outside.wav');
    await writeFile(target, 'outside fixture');
    const f = await fixture({ file: 'link.wav' });
    await symlink(target, join(f.dir, 'link.wav'));
    await expect(readStudioSource(root, f.id)).rejects.toThrow('Invalid Studio audio location');
    const html = await fixture({ content_type: 'text/html' });
    await expect(readStudioSource(root, html.id)).rejects.toThrow('format');
  });
  test('rejects symlinked song folders and metadata', async () => {
    const f = await fixture();
    const aliasId = randomUUID();
    await symlink(f.dir, join(root, 'studio', 'songs', aliasId));
    await expect(readStudioSource(root, aliasId)).rejects.toThrow('Invalid Studio song location');
    const id = randomUUID();
    const dir = join(root, 'studio', 'songs', id);
    await mkdir(dir);
    await symlink(join(f.dir, 'meta.json'), join(dir, 'meta.json'));
    await expect(readStudioSource(root, id)).rejects.toThrow('Invalid Studio song metadata');
  });
  test('rejects corrupt metadata, a mismatched id and a missing audio file', async () => {
    const f = await fixture();
    await writeFile(join(f.dir, 'meta.json'), '{');
    await expect(readStudioSource(root, f.id)).rejects.toThrow('metadata could not be read');
    await writeFile(join(f.dir, 'meta.json'), JSON.stringify({ ...f.song, id: randomUUID() }));
    await expect(readStudioSource(root, f.id)).rejects.toThrow();
    const missing = await fixture({ file: 'missing.wav' });
    await expect(readStudioSource(root, missing.id)).rejects.toThrow('not found');
  });
  test('bounds file and metadata sizes', async () => {
    const f = await fixture();
    const file = await open(join(f.dir, 'audio.wav'), 'r+');
    try {
      await file.truncate(STUDIO_IMPORT_LIMIT + 1);
    } finally {
      await file.close();
    }
    await expect(readStudioSource(root, f.id)).rejects.toThrow('100 MB');
    const huge = await fixture();
    await writeFile(join(huge.dir, 'meta.json'), ' '.repeat(128 * 1024 + 1));
    await expect(readStudioSource(root, huge.id)).rejects.toThrow('metadata is too large');
  });
  test('development permits private metadata and bounded range responses', async () => {
    const f = await fixture();
    await env({ NODE_ENV: 'development', VBM_OWNER_MODE: '0' }, async () => {
      const meta = await studioImportResponse(req(f.id), f.id, root);
      expect(meta.status).toBe(200);
      expect(meta.headers.get('cache-control')).toBe('private, no-store');
      expect(await meta.json()).not.toHaveProperty('path');
      const audio = await studioImportResponse(
        req(f.id, '?audio=1', { range: 'bytes=0-3' }),
        f.id,
        root
      );
      expect(audio.status).toBe(206);
      expect(await audio.text()).toBe('synt');
      expect(audio.headers.get('x-content-type-options')).toBe('nosniff');
      expect(
        (await studioImportResponse(req(f.id, '', { host: 'attacker.example' }), f.id, root)).status
      ).toBe(403);
    });
  });
  test('production refuses direct access and requires the owner edge secret', async () => {
    const f = await fixture();
    await env({ NODE_ENV: 'production', VBM_OWNER_MODE: '0' }, async () => {
      expect((await studioImportResponse(req(f.id), f.id, root)).status).toBe(403);
    });
    await env(
      { NODE_ENV: 'production', VBM_OWNER_MODE: '1', VBM_EDGE_SECRET: 'a'.repeat(40) },
      async () => {
        expect((await studioImportResponse(req(f.id), f.id, root)).status).toBe(403);
        expect(
          (await studioImportResponse(req(f.id, '', { 'x-vbm-edge-auth': 'bad' }), f.id, root))
            .status
        ).toBe(403);
        expect(
          (
            await studioImportResponse(
              req(f.id, '', { 'x-vbm-edge-auth': 'a'.repeat(40) }),
              f.id,
              root
            )
          ).status
        ).toBe(200);
      }
    );
  });
});

describe('browser import transport', () => {
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const metadata = {
    id,
    title: 'Test song',
    filename: 'Test song.wav',
    bytes: 3,
    content_type: 'audio/wav'
  };
  test('loads a file using only same-app GET requests', async () => {
    const paths: string[] = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      paths.push(url);
      expect(init?.method).toBeUndefined();
      return url.endsWith('?audio=1')
        ? new Response(new Uint8Array([1, 2, 3]))
        : Response.json(metadata);
    };
    const result = await loadStudioSong(id, new AbortController().signal, fetcher);
    expect(result.file.name).toBe('Test song.wav');
    expect(new Uint8Array(await result.file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(paths).toEqual(['/api/studio-import/' + id, '/api/studio-import/' + id + '?audio=1']);
  });
  test('rejects truncation and streams larger than declared', async () => {
    for (const bytes of [2, 4]) {
      const fetcher = async (url: string) =>
        url.endsWith('?audio=1') ? new Response(new Uint8Array(bytes)) : Response.json(metadata);
      await expect(loadStudioSong(id, new AbortController().signal, fetcher)).rejects.toThrow();
    }
  });
  test('rejects invalid links, oversized metadata and denied access', async () => {
    await expect(
      loadStudioSong('../bad', new AbortController().signal, () => {
        throw new Error('Should not fetch');
      })
    ).rejects.toThrow('invalid');
    const huge = async () => Response.json({ ...metadata, bytes: STUDIO_IMPORT_LIMIT + 1 });
    await expect(loadStudioSong(id, new AbortController().signal, huge)).rejects.toThrow(
      'oversized'
    );
    const denied = async () => Response.json({ detail: 'Sign in first.' }, { status: 403 });
    await expect(loadStudioSong(id, new AbortController().signal, denied)).rejects.toThrow(
      'Sign in first'
    );
  });
});
