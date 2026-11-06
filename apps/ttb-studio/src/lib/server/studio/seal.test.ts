import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CreateSongRequest, StudioModel, StudioModelInfo } from '@vbm/contracts';
import { createSongs, type CreateDeps } from './create';
import { advanceJob } from './jobs';
import { SongLibrary } from './library';
import { sealSongs, sealedLabel } from './seal';
import { startSeance, type SeanceDeps } from './seance';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-seal-'));
});
afterEach(() => rm(root, { recursive: true, force: true }));

const mp3 = () => {
  const b = new Uint8Array(4096);
  b.set([0x49, 0x44, 0x33], 0);
  return b;
};

/** Fake Replicate: every create is accepted with a fresh id and finishes on the first poll. */
function studio(): CreateDeps {
  let n = 0;
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/predictions')) {
      n += 1;
      return Response.json({ id: 'pred' + String(n).padStart(8, '0'), status: 'starting' });
    }
    const m = /\/predictions\/(pred\d+)$/.exec(url);
    if (m)
      return Response.json({
        id: m[1],
        status: 'succeeded',
        output: 'https://replicate.delivery/' + m[1] + '.mp3'
      });
    if (url.startsWith('https://replicate.delivery/'))
      return new Response(mp3(), { headers: { 'content-type': 'audio/mpeg' } });
    throw new Error('unexpected ' + url);
  }) as typeof fetch;
  return {
    library: new SongLibrary(root),
    replicate: { token: 't', fetch: fetcher },
    fal: null,
    gemini: null,
    fetch: fetcher,
    now: () => new Date('2026-11-06T12:00:00Z')
  };
}

const models: StudioModel[] = [
  'ace-step-1.5',
  'heartmula',
  'minimax-music-2.6',
  'elevenlabs-music'
];
const info = (id: StudioModel): StudioModelInfo => ({
  id,
  name: id,
  open: true,
  vocals: true,
  instrumental: true,
  runners: [],
  est_cost_usd: 0,
  active_runner: 'replicate'
});
const request: CreateSongRequest = {
  mode: 'custom',
  prompt: 'haunted synthwave hymn',
  title: 'Plain',
  lyrics: '[Verse]\nCandles burn beneath the moon',
  style_tags: [],
  instrumental: false,
  engine: 'minimax-music-1.5',
  model: 'heartmula',
  duration_seconds: null,
  sound_character: 'raw',
  takes: 1,
  cover: false
};

function seanceDeps(ctx: CreateDeps): SeanceDeps {
  return {
    root,
    now: ctx.now,
    random: () => 0,
    capabilities: async () => models.map(info),
    writeLyrics: null,
    create: (r, o) => createSongs(ctx, r, o),
    advance: (id) => advanceJob(ctx, id),
    jobRunner: async () => 'replicate'
  };
}

describe('séance job cap', () => {
  test('a 4-model séance gets all 4 takes; normal creates stay capped at 3', async () => {
    const ctx = studio();
    const seance = await startSeance(seanceDeps(ctx), {
      prompt: 'haunted synthwave hymn',
      lyrics: request.lyrics,
      models
    });
    const stored = JSON.parse(
      await readFile(path.join(root, 'studio', 'seances', seance.id + '.json'), 'utf8')
    );
    expect(stored.entries.map((e: { error: string | null }) => e.error)).toEqual([
      null,
      null,
      null,
      null
    ]);
    // Four séance jobs are running, so an ordinary create is refused.
    expect(createSongs(ctx, request)).rejects.toMatchObject({ status: 429 });
  });

  test('without a séance the 4th running job is refused', async () => {
    const ctx = studio();
    for (let i = 0; i < 3; i += 1) await createSongs(ctx, request);
    expect(createSongs(ctx, request)).rejects.toMatchObject({ status: 429 });
  });
});

describe('séance takes are sealed until the reveal', () => {
  test('sealed, then unsealed', async () => {
    const ctx = studio();
    const deps = seanceDeps(ctx);
    const seance = await startSeance(deps, {
      prompt: 'haunted synthwave hymn',
      lyrics: request.lyrics,
      models: ['heartmula', 'ace-step-1.5']
    });
    const file = path.join(root, 'studio', 'seances', seance.id + '.json');
    const stored = JSON.parse(await readFile(file, 'utf8'));
    for (const entry of stored.entries) await advanceJob(ctx, entry.job_id);
    const songs = await ctx.library.list();
    expect(songs).toHaveLength(2);
    expect(songs.every((s) => s.seance_id === seance.id)).toBe(true);

    const sealed = await sealSongs(root, songs);
    for (const song of sealed) {
      expect(song.engine).toBe(sealedLabel);
      expect(song.runner).toBeUndefined();
      expect(song.params.runner).toBeUndefined();
      expect(song.params.model_version).toBeUndefined();
      const text = JSON.stringify(song);
      expect(text).not.toContain('heartmula');
      expect(text).not.toContain('heart_mula');
      expect(text).not.toContain('ace-step');
    }

    await writeFile(file, JSON.stringify({ ...stored, revealed: true }));
    const open = await sealSongs(root, songs);
    expect(open.map((s) => s.engine).sort()).toEqual(['ace-step-1.5', 'heartmula']);
    expect(open[0].runner?.runner).toBe('replicate');
  });

  test('songs outside a séance are untouched; an unreadable séance fails closed', async () => {
    const ctx = studio();
    const { job } = await createSongs(ctx, request);
    await advanceJob(ctx, job.id);
    const [plain] = await ctx.library.list();
    expect((await sealSongs(root, [plain]))[0]).toEqual(plain);
    const orphan = { ...plain, seance_id: '00000000-0000-4000-8000-000000000000' };
    expect((await sealSongs(root, [orphan]))[0].engine).toBe(sealedLabel);
  });
});
