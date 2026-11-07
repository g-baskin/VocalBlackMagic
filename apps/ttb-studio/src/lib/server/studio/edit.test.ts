import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateEditRequest, type EditRequest, type SongMeta } from '@vbm/contracts';
import {
  editInfos,
  engineEditBody,
  falEditBody,
  parseDuration,
  startEdit,
  type EditDeps
} from './edit';
import { advanceJob, loadJob } from './jobs';
import { SongLibrary } from './library';

const engineUrl = 'https://engine.test';
const reqId = '0123abcd-0123-4abc-8def-0123456789ab';
const mp3 = () => {
  const b = new Uint8Array(4096);
  b.set([0x49, 0x44, 0x33], 0);
  return b;
};
const health = (tasks: string[]) => ({
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
      tasks,
      max_duration_seconds: 240
    }
  ]
});

let root: string;
let parent: SongMeta;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-edit-'));
  const lib = new SongLibrary(root);
  const { id, dir } = await lib.reserve();
  await writeFile(path.join(dir, 'audio.mp3'), mp3());
  parent = {
    id,
    title: 'Night Rite',
    prompt: 'gothic synth-pop',
    style_tags: ['gothic'],
    lyrics: '[Verse]\nCandles burn',
    engine: 'minimax-music-1.5',
    params: {},
    created_at: '2026-11-06T12:00:00Z',
    parent_id: null,
    kind: 'original',
    favourite: false,
    audio: { file: 'audio.mp3', content_type: 'audio/mpeg', bytes: 4096 },
    est_cost_usd: 0.03
  };
  await lib.save(parent);
});
afterEach(() => rm(root, { recursive: true, force: true }));

type Handler = (url: string, init?: RequestInit) => Response;
function ctx(handler: Handler, opts: { engine?: boolean; fal?: boolean } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return handler(String(input), init);
  }) as typeof fetch;
  const deps: EditDeps = {
    library: new SongLibrary(root),
    replicate: { token: 't', fetch: fetcher },
    fal: opts.fal ? { apiKey: 'f', fetch: fetcher } : null,
    engine: opts.engine ? { url: engineUrl, token: 'e', fetch: fetcher } : null,
    fetch: fetcher,
    now: () => new Date('2026-11-06T12:00:00Z'),
    probe: async () => 120
  };
  return { deps, calls };
}

describe('edit validation', () => {
  test('extend total, repaint range inside the song, cover strength', () => {
    expect(
      validateEditRequest({ action: 'extend', extend: { after_seconds: 30 } }, 120)
    ).toBeNull();
    expect(
      validateEditRequest(
        { action: 'extend', extend: { before_seconds: 200, after_seconds: 41 } },
        120
      )
    ).toContain('240');
    expect(validateEditRequest({ action: 'extend', extend: {} }, 120)).toContain('Add');
    expect(
      validateEditRequest(
        { action: 'repaint', repaint: { start_seconds: 10, end_seconds: 130 } },
        120
      )
    ).toContain('ends after');
    expect(
      validateEditRequest(
        { action: 'repaint', repaint: { start_seconds: 10, end_seconds: 10.5 } },
        120
      )
    ).toContain('1 second');
    // Exactly 1 s, but 2.3 - 1.3 is 0.9999999999999998 in floating point: still accepted.
    expect(
      validateEditRequest(
        { action: 'repaint', repaint: { start_seconds: 1.3, end_seconds: 2.3 } },
        120
      )
    ).toBeNull();
    expect(validateEditRequest({ action: 'cover', strength: 2, prompt: 'jazz' }, 120)).toContain(
      'Strength'
    );
    expect(validateEditRequest({ action: 'cover', strength: 0.4 }, 120)).toContain('style');
    expect(parseDuration('  Duration: 00:02:03.50, start')).toBe(123.5);
  });
});

describe('edit input mapping', () => {
  const source = { data_b64: 'AAAA', format: 'mp3' as const };
  test('engine bodies follow protocol v1', () => {
    expect(
      engineEditBody(
        { action: 'repaint', repaint: { start_seconds: 5, end_seconds: 20 } },
        parent,
        source
      )
    ).toMatchObject({ task: 'repaint', repaint: { start_seconds: 5, end_seconds: 20 } });
    expect(
      engineEditBody({ action: 'cover', strength: 0.3, prompt: 'dub' }, parent, source)
    ).toMatchObject({ task: 'cover', prompt: 'dub', cover: { strength: 0.3 } });
    expect(
      engineEditBody({ action: 'extend', extend: { after_seconds: 30 } }, parent, source).extend
    ).toEqual({ before_seconds: 0, after_seconds: 30 });
  });
  test('fal bodies use the v1 endpoint field names', () => {
    expect(
      falEditBody({ action: 'extend', extend: { before_seconds: 10 } }, parent, 'data:x')
    ).toMatchObject({ extend_before_duration: 10, extend_after_duration: 0, audio_url: 'data:x' });
    expect(
      falEditBody(
        { action: 'repaint', repaint: { start_seconds: 5, end_seconds: 20 } },
        parent,
        'd'
      )
    ).toMatchObject({ start_time: 5, end_time: 20, start_time_relative_to: 'start' });
    expect(
      falEditBody({ action: 'cover', strength: 1, prompt: 'jazz' }, parent, 'd')
    ).toMatchObject({ tags: 'jazz', original_tags: 'gothic synth-pop', edit_mode: 'remix' });
  });
});

describe('edit routing', () => {
  const repaint: EditRequest = {
    action: 'repaint',
    repaint: { start_seconds: 30, end_seconds: 45 }
  };

  test('capabilities explain why edits are unavailable', async () => {
    const { deps } = ctx(() => new Response('', { status: 500 }));
    const infos = await editInfos(deps, parent);
    expect(infos.every((i) => !i.available)).toBe(true);
    expect(infos[0].reason).toContain('needs FAL_KEY');
    expect(infos[0].reason).toContain('no source-audio');
  });

  test('engine without the task is skipped; fal takes it; result is a new child song', async () => {
    const { deps, calls } = ctx(
      (url) => {
        if (url === engineUrl + '/v1/health') return Response.json(health(['text2music', 'cover']));
        if (url === 'https://queue.fal.run/fal-ai/ace-step/audio-inpaint')
          return Response.json({ request_id: reqId });
        if (url.endsWith('/fal-ai/ace-step/requests/' + reqId + '/status'))
          return Response.json({ status: 'COMPLETED' });
        if (url.endsWith('/fal-ai/ace-step/requests/' + reqId))
          return Response.json({ audio: { url: 'https://v3.fal.media/files/x.mp3' } });
        if (url === 'https://v3.fal.media/files/x.mp3')
          return new Response(mp3(), { headers: { 'content-type': 'audio/mpeg' } });
        throw new Error('unexpected ' + url);
      },
      { engine: true, fal: true }
    );
    const job = await startEdit(deps, parent.id, repaint);
    const record = await loadJob(deps, job.id);
    expect(record.plan.runner?.attempts.map((a) => a.outcome)).toEqual([
      'the engine does not offer repaint for ace-step-1.5',
      'submitted'
    ]);
    const body = JSON.parse(String(calls.find((c) => c.url.includes('audio-inpaint'))!.init!.body));
    expect(body.audio_url.startsWith('data:audio/mpeg;base64,')).toBe(true);
    const done = await advanceJob(deps, job.id);
    const child = await deps.library.get(done.song_ids[0]);
    expect(child).toMatchObject({ parent_id: parent.id, kind: 'repaint', engine: 'ace-step-1.5' });
    expect(child.runner?.runner).toBe('fal');
    const original = await readFile(path.join(root, 'studio', 'songs', parent.id, 'audio.mp3'));
    expect(original.length).toBe(4096);
  });

  test('an engine refusal before a job falls back; an accepted job never does', async () => {
    let engineStatus = 429;
    const { deps, calls } = ctx(
      (url) => {
        if (url === engineUrl + '/v1/health')
          return Response.json(health(['text2music', 'repaint']));
        if (url === engineUrl + '/v1/jobs')
          return engineStatus === 429
            ? Response.json({ detail: 'full', code: 'queue_full' }, { status: 429 })
            : Response.json(
                {
                  id: 'j9',
                  status: 'queued',
                  model: 'ace-step-1.5',
                  task: 'repaint',
                  created_at: 'x'
                },
                { status: 202 }
              );
        if (url.includes('audio-inpaint')) return Response.json({ request_id: reqId });
        if (url === engineUrl + '/v1/jobs/j9')
          return Response.json({ detail: 'boom', code: 'internal' }, { status: 500 });
        throw new Error('unexpected ' + url);
      },
      { engine: true, fal: true }
    );
    const first = await loadJob(deps, (await startEdit(deps, parent.id, repaint)).id);
    expect(first.tasks[0].provider).toBe('fal');
    expect(first.plan.runner?.attempts[0].outcome).toContain('refused');

    engineStatus = 202;
    const before = calls.filter((c) => c.url.includes('fal.run')).length;
    const second = await startEdit(deps, parent.id, repaint);
    expect((await loadJob(deps, second.id)).tasks[0]).toMatchObject({ provider: 'engine' });
    await advanceJob(deps, second.id);
    expect(calls.filter((c) => c.url.includes('fal.run')).length).toBe(before);
  });

  test('a range past the measured end is refused before any provider call', async () => {
    const { deps, calls } = ctx(() => new Response('', { status: 500 }), { fal: true });
    const error = await startEdit(deps, parent.id, {
      action: 'repaint',
      repaint: { start_seconds: 100, end_seconds: 130 }
    }).catch((e) => e);
    expect(error.status).toBe(422);
    expect(calls).toHaveLength(0);
  });
});
