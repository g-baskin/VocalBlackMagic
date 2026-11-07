// Regression tests for the PR #10 review findings (mocked fetch only; nothing is spent).
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CreateSongRequest, SongMeta } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { createSongs, type CreateDeps } from './create';
import { boundedProbe, editInfos, startEdit, type EditDeps } from './edit';
import { advanceJob, loadJob, recordJob, transientEngineError } from './jobs';
import { SongLibrary } from './library';
import { modelInfos } from './runners/capabilities';
import { sealSong } from './seal';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-review-'));
});
afterEach(() => rm(root, { recursive: true, force: true }));

const mp3 = () => {
  const b = new Uint8Array(4096);
  b.set([0x49, 0x44, 0x33], 0);
  return b;
};
const engineUrl = 'https://engine.test';
const health = {
  ok: true,
  protocol: 1,
  version: 't',
  device: 'cpu',
  concurrency: 1,
  queued: 0,
  running: 0,
  models: [
    {
      id: 'ace-step-1.5',
      license: 'MIT',
      commercial: true,
      installed: true,
      ready: true,
      tasks: ['text2music', 'extend', 'repaint', 'cover'],
      max_duration_seconds: 240
    }
  ]
};

function recorder(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: string[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(input));
    return handler(String(input), init);
  }) as typeof fetch;
  return { fetcher, calls };
}

const song = (over: Partial<SongMeta> = {}): SongMeta => ({
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Candle Séance · C',
  prompt: 'haunted synthwave',
  style_tags: [],
  lyrics: 'Lyria rewrote these words',
  engine: 'lyria-3-pro',
  params: { runner: 'gemini', model_version: 'lyria-3-pro-preview', take: 1, duration_seconds: 60 },
  created_at: '2026-11-06T12:00:00Z',
  parent_id: null,
  kind: 'original',
  favourite: false,
  audio: { file: 'audio.mp3', content_type: 'audio/mpeg', bytes: 4096 },
  est_cost_usd: 0.08,
  seance_id: '22222222-2222-4222-8222-222222222222',
  ...over
});

describe('1. sealed takes hide price and model-written lyrics', () => {
  test('est_cost_usd, runner params and self-written lyrics are hidden', () => {
    const shared = {
      id: '22222222-2222-4222-8222-222222222222',
      prompt: 'haunted synthwave',
      lyrics: '[Verse]\nshared words',
      title: 'Candle Séance',
      instrumental: false,
      created_at: '',
      revealed: false,
      ranking: null,
      entries: []
    };
    const sealed = sealSong(song(), shared);
    expect(sealed.est_cost_usd).toBe(0);
    expect(sealed.lyrics).toBe('[Verse]\nshared words');
    expect(sealed.params).toEqual({ take: 1, duration_seconds: 60 });
    const text = JSON.stringify(sealed);
    for (const word of ['lyria', 'gemini', '0.08', 'Lyria rewrote'])
      expect(text).not.toContain(word);
    // Unreadable séance: nothing to substitute, so no lyrics at all rather than the model's.
    expect(sealSong(song(), null).lyrics).toBeNull();
  });
});

describe('2. synchronous routed results get cover art', () => {
  test('an ElevenLabs direct song asks FLUX for a cover when cover is on', async () => {
    const { fetcher, calls } = recorder((url) => {
      if (url.startsWith('https://api.elevenlabs.io/v1/music'))
        return new Response(mp3(), { headers: { 'content-type': 'audio/mpeg' } });
      if (url.includes('flux-schnell')) return new Response('stop here', { status: 500 });
      throw new Error('unexpected ' + url);
    });
    const deps: CreateDeps = {
      library: new SongLibrary(root),
      replicate: { token: 't', fetch: fetcher },
      fal: null,
      gemini: null,
      fetch: fetcher,
      now: () => new Date('2026-11-06T12:00:00Z'),
      direct: { anthropic: null, openai: null, minimax: null, elevenlabs: 'k', engine: null }
    };
    const request: CreateSongRequest = {
      mode: 'custom',
      prompt: 'dark synth hymn with choir',
      title: 'Cover me',
      lyrics: '[Verse]\nCandles burn beneath the moon',
      style_tags: [],
      instrumental: false,
      engine: 'minimax-music-1.5',
      model: 'elevenlabs-music',
      duration_seconds: 60,
      sound_character: 'raw',
      takes: 1,
      cover: true
    };
    const { job } = await createSongs(deps, request);
    expect(job.status).toBe('completed');
    expect(calls.filter((u) => u.includes('flux-schnell'))).toHaveLength(1);
    // The cover failed (500) but never fails the song.
    expect(job.song_ids).toHaveLength(1);
  });
});

describe('5. one engine health read per call', () => {
  test('modelInfos and editInfos read health once, and share a failure', async () => {
    let reads = 0;
    const ok = recorder((url) => {
      if (url === engineUrl + '/v1/health') {
        reads += 1;
        return Response.json(health);
      }
      throw new Error('unexpected ' + url);
    });
    const engine = { url: engineUrl, token: 'e', fetch: ok.fetcher };
    const keys = {
      engine,
      fal: false,
      minimax: false,
      elevenlabs: false,
      gemini: false,
      replicate: true
    };
    await modelInfos(keys, true);
    expect(reads).toBe(1);

    reads = 0;
    const library = new SongLibrary(root);
    const edits = await editInfos(
      {
        library,
        replicate: null,
        fal: null,
        engine,
        fetch: ok.fetcher,
        now: () => new Date()
      },
      song({ seance_id: undefined })
    );
    expect(reads).toBe(1);
    expect(edits.every((e) => e.available)).toBe(true);

    let failures = 0;
    const down = recorder(() => {
      failures += 1;
      throw new TypeError('connection refused');
    });
    const infos = await modelInfos(
      { ...keys, engine: { url: engineUrl, token: 'e', fetch: down.fetcher } },
      true
    );
    expect(failures).toBe(1);
    expect(infos.find((m) => m.id === 'heartmula')!.active_runner).toBe('replicate');
  });
});

describe('6. bounded duration probe', () => {
  test('a failing or hanging probe means unknown, not a crash', async () => {
    expect(await boundedProbe(async () => 42, 'f', 100)).toBe(42);
    expect(
      await boundedProbe(
        async () => {
          throw new Error('ffmpeg missing');
        },
        'f',
        100
      )
    ).toBeNull();
    expect(await boundedProbe(() => new Promise<number>(() => undefined), 'f', 20)).toBeNull();
  });

  test('extend continues without a duration; repaint still refuses', async () => {
    const library = new SongLibrary(root);
    const { id, dir } = await library.reserve();
    await writeFile(path.join(dir, 'audio.mp3'), mp3());
    await library.save(song({ id, seance_id: undefined, params: {} }));
    const { fetcher } = recorder((url) => {
      if (url === engineUrl + '/v1/health') return Response.json(health);
      if (url === engineUrl + '/v1/jobs')
        return Response.json(
          { id: 'e1', status: 'queued', model: 'ace-step-1.5', task: 'extend', created_at: 'x' },
          { status: 202 }
        );
      throw new Error('unexpected ' + url);
    });
    const deps: EditDeps = {
      library,
      replicate: null,
      fal: null,
      engine: { url: engineUrl, token: 'e', fetch: fetcher },
      fetch: fetcher,
      now: () => new Date('2026-11-06T12:00:00Z'),
      probe: () => new Promise<number>(() => undefined),
      probeTimeoutMs: 20
    };
    const job = await startEdit(deps, id, { action: 'extend', extend: { after_seconds: 30 } });
    expect((await loadJob(deps, job.id)).plan.params.source_seconds).toBeNull();
    const refused = await startEdit(deps, id, {
      action: 'repaint',
      repaint: { start_seconds: 5, end_seconds: 20 }
    }).catch((e) => e);
    expect(refused).toBeInstanceOf(ProviderError);
    expect(refused.status).toBe(503);
  });
});

describe('7. transient engine polling errors', () => {
  test('classification', () => {
    expect(transientEngineError(new ProviderError(502, 'x'))).toBe(true);
    expect(transientEngineError(new ProviderError(429, 'x'))).toBe(true);
    expect(transientEngineError(new TypeError('fetch failed'))).toBe(true);
    expect(transientEngineError(new DOMException('t', 'TimeoutError'))).toBe(true);
    expect(transientEngineError(new ProviderError(404, 'x'))).toBe(false);
  });

  test('a 5xx then a network error keep the task running; it later stores the audio', async () => {
    let step = 0;
    const { fetcher } = recorder((url) => {
      if (url === engineUrl + '/v1/jobs/j1') {
        step += 1;
        if (step === 1) return Response.json({ detail: 'oops', code: 'internal' }, { status: 500 });
        if (step === 2) throw new TypeError('connection reset');
        return Response.json({
          id: 'j1',
          status: 'succeeded',
          model: 'heartmula',
          task: 'text2music',
          created_at: 'x',
          output: {
            audio_url: '/v1/jobs/j1/audio',
            format: 'mp3',
            duration_seconds: 30,
            sample_rate: 44100,
            seed: 1
          }
        });
      }
      if (url === engineUrl + '/v1/jobs/j1/audio')
        return new Response(mp3(), { headers: { 'content-type': 'audio/mpeg' } });
      throw new Error('unexpected ' + url);
    });
    const ctx = {
      library: new SongLibrary(root),
      replicate: null,
      fal: null,
      engine: { url: engineUrl, token: 'e', fetch: fetcher },
      fetch: fetcher,
      now: () => new Date('2026-11-06T12:00:00Z')
    };
    const job = await recordJob(
      ctx,
      'create',
      {
        title: 'Engine song',
        prompt: 'p',
        style_tags: [],
        lyrics: null,
        engine: 'heartmula',
        params: {},
        parent_id: null,
        kind: 'original',
        est_cost_usd: 0
      },
      [{ provider: 'engine', prediction_id: 'j1', take: 1, status: 'running' }]
    );
    expect((await advanceJob(ctx, job.id)).status).toBe('running');
    expect((await advanceJob(ctx, job.id)).status).toBe('running');
    const done = await advanceJob(ctx, job.id);
    expect(done.status).toBe('completed');
    expect(done.song_ids).toHaveLength(1);
  });
});
