import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateCreateSongRequest, type CreateSongRequest, type SongMeta } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { createSongs, type CreateDeps } from './create';
import { engineRequestError, fitLyrics, minimaxLyrics, replicateInput } from './engines';
import { advanceJob, cancelJob, loadJob } from './jobs';
import { LibraryError, SongLibrary, parseWhich } from './library';
import { buildLyricsPrompt, parseLyricsOutput } from './lyrics';
import { masterArgs, measureArgs, parseLoudnorm } from './master';
import { isLocalHost, resolveDataDir } from './paths';
import { parseRange } from './range';
import {
  cancelPrediction,
  createPrediction,
  fetchOutput,
  isAllowedOutputUrl,
  outputText,
  replicateFailure
} from './replicate';
import { isUsableVoice, readVoices, usableVoices } from './voices';
import { startVoice } from './derive';

type Call = { url: string; init?: RequestInit };
function fakeFetch(handler: (url: string, init?: RequestInit) => Response): {
  fetch: typeof fetch;
  calls: Call[];
} {
  const calls: Call[] = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return handler(String(input), init);
  }) as typeof fetch;
  return { fetch: fn, calls };
}
const mp3 = (size = 4096) => {
  const b = new Uint8Array(size);
  b.set([0x49, 0x44, 0x33], 0);
  return b;
};
const wav = (size = 4096) => {
  const b = new Uint8Array(size);
  b.set(
    Uint8Array.from('RIFF', (c) => c.charCodeAt(0)),
    0
  );
  b.set(
    Uint8Array.from('WAVE', (c) => c.charCodeAt(0)),
    8
  );
  return b;
};
const pid = 'abc123def456ghi7';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-studio-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const request: CreateSongRequest = {
  mode: 'custom',
  prompt: 'Haunted gothic synth-pop with choir pads',
  title: 'Night Rite',
  lyrics:
    '[Verse 1]\nCandles burn beneath the moon\nWe sing the names we lost too soon\n[Chorus]\nRise, rise, the night is ours',
  style_tags: ['gothic', 'synth-pop'],
  instrumental: false,
  engine: 'minimax-music-1.5',
  duration_seconds: null,
  sound_character: 'clean',
  takes: 1
};

describe('replicate adapter', () => {
  test('official models use the model endpoint, community models a pinned version', async () => {
    const { fetch, calls } = fakeFetch(() =>
      Response.json({ id: pid, status: 'starting' }, { status: 201 })
    );
    await createPrediction(
      { token: 't0k', fetch },
      { owner: 'minimax', name: 'music-1.5' },
      { a: 1 }
    );
    await createPrediction(
      { token: 't0k', fetch },
      { owner: 'x', name: 'y', version: 'v1' },
      { a: 1 }
    );
    expect(calls[0].url).toBe('https://api.replicate.com/v1/models/minimax/music-1.5/predictions');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ input: { a: 1 } });
    expect(calls[1].url).toBe('https://api.replicate.com/v1/predictions');
    expect(JSON.parse(String(calls[1].init?.body))).toEqual({ version: 'v1', input: { a: 1 } });
    expect((calls[0].init?.headers as Record<string, string>).authorization).toBe('Bearer t0k');
  });
  test('maps provider errors to clear statuses', async () => {
    expect((await replicateFailure(new Response('x', { status: 401 }), 'create')).status).toBe(502);
    expect((await replicateFailure(new Response('x', { status: 402 }), 'create')).status).toBe(402);
    expect((await replicateFailure(new Response('x', { status: 429 }), 'create')).status).toBe(429);
    expect((await replicateFailure(new Response('x', { status: 422 }), 'create')).status).toBe(422);
    const { fetch } = fakeFetch(() => Response.json({ id: '../evil', status: 'starting' }));
    expect(createPrediction({ token: 't', fetch }, { owner: 'a', name: 'b' }, {})).rejects.toThrow(
      ProviderError
    );
  });
  test('throttled creates are retried after retry_after', async () => {
    let n = 0;
    const { fetch, calls } = fakeFetch(() =>
      n++ === 0
        ? Response.json({ retry_after: 2 }, { status: 429 })
        : Response.json({ id: pid, status: 'starting' }, { status: 201 })
    );
    const waits: number[] = [];
    const sleep = async (ms: number) => void waits.push(ms);
    expect(
      (await createPrediction({ token: 't', fetch, sleep }, { owner: 'a', name: 'b' }, {})).id
    ).toBe(pid);
    expect(calls.length).toBe(2);
    expect(waits).toEqual([2250]);
  });
  test('cancel tolerates finished predictions', async () => {
    const { fetch, calls } = fakeFetch(() => new Response('', { status: 409 }));
    await cancelPrediction({ token: 't', fetch }, pid);
    expect(calls[0].url).toBe('https://api.replicate.com/v1/predictions/' + pid + '/cancel');
  });
  test('only replicate.delivery outputs are fetched, without the token, and off-host redirects are refused', async () => {
    expect(isAllowedOutputUrl('https://replicate.delivery/x/out.mp3')).toBe(true);
    expect(isAllowedOutputUrl('https://pbxt.replicate.delivery/x.mp3')).toBe(true);
    expect(isAllowedOutputUrl('http://replicate.delivery/x.mp3')).toBe(false);
    expect(
      isAllowedOutputUrl(
        'https://ai-gateway-outputs.0d37909e38d3e99c29fa2cd343ac421a.r2.cloudflarestorage.com/x'
      )
    ).toBe(true);
    expect(isAllowedOutputUrl('https://evil.r2.cloudflarestorage.com/x')).toBe(false);
    expect(isAllowedOutputUrl('https://evil.example/replicate.delivery')).toBe(false);
    const { fetch, calls } = fakeFetch(
      () => new Response(null, { status: 302, headers: { location: 'https://169.254.169.254/' } })
    );
    expect(fetchOutput(fetch, 'https://replicate.delivery/a.mp3')).rejects.toThrow(ProviderError);
    expect(calls[0].init?.headers).toBeUndefined();
  });
  test('text output is concatenated', () => {
    expect(outputText(['Hel', 'lo'])).toBe('Hello');
    expect(() => outputText({})).toThrow(ProviderError);
  });
});

describe('engines', () => {
  test('minimax lyrics use its lowercase tags and limits are enforced', () => {
    expect(minimaxLyrics('[Verse 1]\nA\n[Pre-Chorus]\nB\n[Chorus]\nC\n[Breakdown]\nD')).toBe(
      '[verse]\nA\n[verse]\nB\n[chorus]\nC\n\nD'
    );
    expect(engineRequestError(request, request.lyrics)).toBeNull();
    expect(engineRequestError({ ...request, instrumental: true }, null)).toContain(
      'cannot make instrumentals'
    );
    expect(engineRequestError({ ...request, engine: 'stable-audio-2.5' }, null)).toContain(
      'instrumentals only'
    );
    expect(engineRequestError(request, 'x\n'.repeat(400))).toContain('accepts 600');
    expect(
      engineRequestError({ ...request, engine: 'ace-step-replicate', duration_seconds: 300 }, 'la')
    ).toContain('10–240');
    expect(fitLyrics('aaa\nbbb\nccc', 8)).toBe('aaa\nbbb');
  });
  test('builds schema-shaped inputs', () => {
    expect(replicateInput(request, request.lyrics)).toMatchObject({
      audio_format: 'mp3',
      sample_rate: 44100
    });
    expect(
      replicateInput(
        { ...request, engine: 'ace-step-replicate', instrumental: true, duration_seconds: 30 },
        null
      )
    ).toMatchObject({ lyrics: '[inst]', duration: 30 });
    expect(validateCreateSongRequest(request)).toBeNull();
    expect(validateCreateSongRequest({ ...request, takes: 3 })).toContain('takes');
  });
});

describe('lyrics', () => {
  test('prompt fences user text and output parsing extracts the title', () => {
    const prompt = buildLyricsPrompt({
      action: 'rewrite',
      description: 'a <b>song',
      lyrics: 'hello there friend',
      instruction: '',
      max_chars: 600
    });
    expect(prompt).toContain('<lyrics>\nhello there friend\n</lyrics>');
    expect(prompt).not.toContain('<b>');
    expect(
      parseLyricsOutput('TITLE: "Moon Rite"\n\n[Verse]\nCandles burning in the dark', 600)
    ).toEqual({ title: 'Moon Rite', lyrics: '[Verse]\nCandles burning in the dark' });
    expect(() => parseLyricsOutput('ooh ooh la la', 600)).toThrow(ProviderError);
    expect(
      parseLyricsOutput('[Verse]\nCandles burning in the dark\n\n[Bridge]\n[Outro]', 600).lyrics
    ).toBe('[Verse]\nCandles burning in the dark');
  });
});

describe('song library', () => {
  test('rejects traversal ids and reports missing files', async () => {
    const lib = new SongLibrary(root);
    expect(() => lib.songDir('../../etc')).toThrow(LibraryError);
    expect(lib.get('..%2f')).rejects.toThrow(LibraryError);
    const { id } = await lib.reserve();
    const meta: SongMeta = {
      id,
      title: 'T',
      prompt: 'p',
      style_tags: [],
      lyrics: null,
      engine: 'e',
      params: {},
      created_at: '2026-11-06T00:00:00.000Z',
      parent_id: null,
      kind: 'original',
      favourite: false,
      audio: { file: '../../../etc/passwd', content_type: 'audio/mpeg', bytes: 1 },
      est_cost_usd: 0
    };
    await lib.save(meta);
    expect(lib.audioFile(id, 'main')).rejects.toThrow('no such audio');
    await lib.save({ ...meta, audio: { file: 'audio.mp3', content_type: 'audio/mpeg', bytes: 1 } });
    expect(lib.audioFile(id, 'main')).rejects.toThrow('missing');
    expect(lib.audioFile(id, 'vocals')).rejects.toThrow('no such audio');
    expect(parseWhich('../x')).toBeNull();
    expect(parseWhich('drums')).toBe('drums');
  });
  test('lists newest first, skips corrupt folders, renames, favourites and deletes', async () => {
    const lib = new SongLibrary(root);
    const a = await lib.reserve();
    const b = await lib.reserve();
    const base = {
      prompt: 'p',
      style_tags: [],
      lyrics: null,
      engine: 'e',
      params: {},
      parent_id: null,
      kind: 'original' as const,
      favourite: false,
      audio: null,
      est_cost_usd: 0
    };
    await lib.save({ ...base, id: a.id, title: 'Old', created_at: '2026-01-01T00:00:00.000Z' });
    await lib.save({ ...base, id: b.id, title: 'New', created_at: '2026-02-01T00:00:00.000Z' });
    const c = await lib.reserve();
    await writeFile(path.join(c.dir, 'meta.json'), '{oops');
    expect((await lib.list()).map((s) => s.title)).toEqual(['New', 'Old']);
    expect((await lib.update(a.id, { title: ' Renamed ', favourite: true })).title).toBe('Renamed');
    expect(lib.update(a.id, { title: '  ' })).rejects.toThrow(LibraryError);
    await lib.remove(b.id);
    expect(lib.get(b.id)).rejects.toThrow('not found');
  });
  test('data dir honours VBM_DATA_DIR then the bun.lock repo root', async () => {
    expect(resolveDataDir('/x/y', '/')).toBe('/x/y');
    await mkdir(path.join(root, 'apps', 'a'), { recursive: true });
    await writeFile(path.join(root, 'bun.lock'), '');
    expect(resolveDataDir(undefined, path.join(root, 'apps', 'a'))).toBe(path.join(root, 'data'));
  });
  test('range parsing', () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=100-', 100)).toBe('invalid');
    expect(parseRange('bytes=1-2,4-5', 100)).toBe('invalid');
  });
});

const consent = {
  own_voice: true,
  attested_name: 'Ada',
  statement: 'My voice',
  attested_at: '2026-11-01T00:00:00Z',
  session_id: 'sess-1'
};
const voiceId = (n: number) => 'voice-0000000' + n + '-0000-4000-8000-000000000000';
async function writeVoice(id: string, extra: Record<string, unknown>) {
  const dir = path.join(root, 'shared', 'voices');
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, id + '.json'),
    JSON.stringify({
      id,
      performer: 'Ada',
      status: 'ready',
      created_at: '2026-11-01T00:00:00Z',
      consent,
      provider: 'replicate',
      model_url: 'https://replicate.delivery/m.zip',
      ...extra
    })
  );
}

describe('voice registry', () => {
  test('only ready, own-voice voices with a model are usable', async () => {
    await writeVoice(voiceId(1), {});
    await writeVoice(voiceId(2), { status: 'training', model_url: null });
    await writeVoice(voiceId(3), { consent: { ...consent, own_voice: false } });
    await writeVoice(voiceId(4), { id: voiceId(5) });
    await writeFile(path.join(root, 'shared', 'voices', 'junk.json'), '{');
    expect((await readVoices(root)).map((v) => v.id)).toEqual([voiceId(1), voiceId(2)]);
    expect((await usableVoices(root)).map((v) => v.id)).toEqual([voiceId(1)]);
    const training = (await readVoices(root))[1];
    expect(isUsableVoice(training)).toBe(false);
    expect(await usableVoices(path.join(root, 'none'))).toEqual([]);
  });
});

describe('studio master', () => {
  test('ffmpeg commands are argument arrays targeting -14 LUFS / -1 dBTP', () => {
    const measure = measureArgs('/in put.mp3');
    expect(measure).toContain('/in put.mp3');
    expect(measure.join(' ')).toContain('loudnorm=I=-14:TP=-1:LRA=11:print_format=json');
    const args = masterArgs('/a.mp3', '/b.wav', {
      input_i: '-20.1',
      input_tp: '-3.0',
      input_lra: '6.0',
      input_thresh: '-30.5',
      target_offset: '0.2'
    });
    const filter = args[args.indexOf('-af') + 1];
    expect(filter).toContain('acompressor=');
    expect(filter).toContain('measured_I=-20.1');
    expect(filter).toContain('linear=true');
    expect(args.at(-1)).toBe('/b.wav');
    expect(args).toContain('pcm_s24le');
  });
  test('parses loudnorm reports and refuses silent input', () => {
    const report =
      '[Parsed_loudnorm] \n{\n"input_i" : "-20.0", "input_tp" : "-2.0", "input_lra" : "5.0", "input_thresh" : "-30.0", "output_i" : "-14.0", "output_tp" : "-1.0", "target_offset" : "0.0"\n}';
    expect(parseLoudnorm(report).output_i).toBe('-14.0');
    expect(() => parseLoudnorm(report.replace('-20.0', '-inf').replace('"-2.0"', '"nan"'))).toThrow(
      ProviderError
    );
  });
});

function deps(fetch: typeof fetch): CreateDeps {
  return {
    library: new SongLibrary(root),
    replicate: { token: 'tok', fetch },
    fal: null,
    gemini: null,
    fetch,
    now: () => new Date('2026-11-06T12:00:00Z')
  };
}

describe('studio jobs', () => {
  test('create → poll → verified audio stored in the library', async () => {
    let status = 'processing';
    const { fetch, calls } = fakeFetch((url) => {
      if (url.endsWith('/predictions') && url.includes('minimax'))
        return Response.json({ id: pid, status: 'starting' }, { status: 201 });
      if (url.endsWith('/predictions/' + pid))
        return Response.json({ id: pid, status, output: 'https://replicate.delivery/out.mp3' });
      if (url === 'https://replicate.delivery/out.mp3')
        return new Response(mp3(), { headers: { 'content-type': 'audio/mpeg' } });
      throw new Error('unexpected ' + url);
    });
    const ctx = deps(fetch);
    const { job } = await createSongs(ctx, request);
    expect(job.status).toBe('running');
    expect((await advanceJob(ctx, job.id)).status).toBe('running');
    status = 'succeeded';
    const done = await advanceJob(ctx, job.id);
    expect(done.status).toBe('completed');
    expect(done.stages.every((s) => s.state === 'done')).toBe(true);
    const song = await ctx.library.get(done.song_ids[0]);
    expect(song).toMatchObject({
      title: 'Night Rite',
      kind: 'original',
      engine: 'minimax-music-1.5',
      audio: { file: 'audio.mp3', content_type: 'audio/mpeg', bytes: 4096 }
    });
    expect((await ctx.library.audioFile(song.id, 'main')).size).toBe(4096);
    const download = calls.find((c) => c.url.startsWith('https://replicate.delivery'));
    expect(download?.init?.headers).toBeUndefined();
  });
  test('non-audio output fails the job instead of storing it', async () => {
    const { fetch } = fakeFetch((url) => {
      if (url.includes('/models/'))
        return Response.json({ id: pid, status: 'starting' }, { status: 201 });
      if (url.endsWith(pid))
        return Response.json({
          id: pid,
          status: 'succeeded',
          output: 'https://replicate.delivery/x.mp3'
        });
      return new Response('<html>' + 'x'.repeat(2000));
    });
    const ctx = deps(fetch);
    const { job } = await createSongs(ctx, request);
    const done = await advanceJob(ctx, job.id);
    expect(done.status).toBe('failed');
    expect(await ctx.library.list()).toEqual([]);
  });
  test('cancel cancels running predictions', async () => {
    const { fetch, calls } = fakeFetch((url) => {
      if (url.endsWith('/cancel')) return Response.json({});
      return Response.json({ id: pid, status: 'starting' }, { status: 201 });
    });
    const ctx = deps(fetch);
    const { job } = await createSongs(ctx, request);
    expect((await cancelJob(ctx, job.id)).status).toBe('canceled');
    expect(calls.some((c) => c.url.endsWith(pid + '/cancel'))).toBe(true);
    expect((await loadJob(ctx, job.id)).tasks[0].status).toBe('canceled');
  });
  test('missing token is an explicit 503, never a fake success', async () => {
    const ctx = { ...deps(fakeFetch(() => new Response()).fetch), replicate: null };
    expect(createSongs(ctx, request)).rejects.toMatchObject({ status: 503 });
  });
  test('stems store four verified derived files; voice records consent', async () => {
    const parentCtx = deps(fakeFetch(() => new Response()).fetch);
    const { id, dir } = await parentCtx.library.reserve();
    await writeFile(path.join(dir, 'audio.mp3'), mp3());
    await parentCtx.library.save({
      id,
      title: 'Parent',
      prompt: 'p',
      style_tags: [],
      lyrics: 'la',
      engine: 'e',
      params: {},
      created_at: '2026-11-06T00:00:00.000Z',
      parent_id: null,
      kind: 'original',
      favourite: false,
      audio: { file: 'audio.mp3', content_type: 'audio/mpeg', bytes: 4096 },
      est_cost_usd: 0
    });
    const stems = {
      vocals: 'data:audio/x-wav;base64,' + Buffer.from(wav()).toString('base64'),
      drums: 'https://replicate.delivery/d.wav',
      bass: 'https://replicate.delivery/b.wav',
      other: 'https://replicate.delivery/o.wav'
    };
    const { fetch, calls } = fakeFetch((url) => {
      if (url.endsWith('/v1/files'))
        return Response.json({ urls: { get: 'https://api.replicate.com/v1/files/f1' } });
      if (url.endsWith('/v1/predictions'))
        return Response.json({ id: pid, status: 'starting' }, { status: 201 });
      if (url.endsWith(pid)) return Response.json({ id: pid, status: 'succeeded', output: stems });
      return new Response(wav());
    });
    const ctx = deps(fetch);
    const { startStems } = await import('./derive');
    const job = await startStems(ctx, id);
    expect(JSON.parse(String(calls[1].init?.body)).input.audio).toBe(
      'https://api.replicate.com/v1/files/f1'
    );
    const done = await advanceJob(ctx, job.id);
    const derived = await ctx.library.get(done.song_ids[0]);
    expect(derived.kind).toBe('stems');
    expect(derived.parent_id).toBe(id);
    expect(derived.stems?.map((s) => s.file)).toEqual([
      'stems/vocals.wav',
      'stems/drums.wav',
      'stems/bass.wav',
      'stems/other.wav'
    ]);

    await writeVoice(voiceId(1), {});
    const [voice] = await usableVoices(root);
    const voiceJob = await startVoice(ctx, id, voice);
    const record = await loadJob(ctx, voiceJob.id);
    expect(record.plan.voice).toEqual({
      voice_id: voiceId(1),
      performer: 'Ada',
      consent_ref: 'sess-1',
      attested_at: consent.attested_at
    });
    const body = JSON.parse(String(calls.at(-1)?.init?.body));
    expect(body.input).toMatchObject({
      rvc_model: 'CUSTOM',
      custom_rvc_model_download_url: 'https://replicate.delivery/m.zip'
    });
    expect(startVoice(ctx, id, { ...voice, status: 'training' })).rejects.toMatchObject({
      status: 422
    });
  });
});

describe('voice model file', () => {
  test('prefers the local zip, uploads it, and rejects unsafe names', async () => {
    const { voiceModelUrl } = await import('./derive');
    const id = voiceId(7);
    await writeVoice(id, { model_file: id + '.model.zip' });
    await writeFile(path.join(root, 'shared', 'voices', id + '.model.zip'), 'PK zip');
    const [voice] = await readVoices(root);
    const { fetch, calls } = fakeFetch(() =>
      Response.json({ urls: { get: 'https://api.replicate.com/v1/files/zip1' } })
    );
    const ctx = deps(fetch);
    expect(await voiceModelUrl(ctx, ctx.replicate!, voice)).toBe(
      'https://api.replicate.com/v1/files/zip1'
    );
    expect(calls[0].url).toBe('https://api.replicate.com/v1/files');
    expect(
      voiceModelUrl(ctx, ctx.replicate!, { ...voice, model_file: '../../x.model.zip' })
    ).rejects.toMatchObject({ status: 422 });
    expect(
      voiceModelUrl(ctx, ctx.replicate!, { ...voice, model_file: voiceId(8) + '.model.zip' })
    ).rejects.toMatchObject({ status: 422 });
    expect(await voiceModelUrl(ctx, ctx.replicate!, { ...voice, model_file: undefined })).toBe(
      'https://replicate.delivery/m.zip'
    );
  });
});

describe('cover art', () => {
  test('prompt is arcane, text-free and fenced; images are sniffed', async () => {
    const { buildCoverPrompt, sniffImage } = await import('./cover');
    const prompt = buildCoverPrompt({
      title: 'Candle "Rite"',
      prompt: 'gothic <b>synth',
      style_tags: ['dark'],
      lyrics: 'Candles burn beneath the moon'
    });
    expect(prompt).toContain('No text');
    expect(prompt).toContain('no real people');
    expect(prompt).toContain('flickering flame');
    expect(prompt).not.toContain('<b>');
    expect(prompt).not.toContain('"Rite"');
    const webp = new Uint8Array(16);
    webp.set(
      Uint8Array.from('RIFF', (c) => c.charCodeAt(0)),
      0
    );
    webp.set(
      Uint8Array.from('WEBP', (c) => c.charCodeAt(0)),
      8
    );
    expect(sniffImage(webp)).toBe('image/webp');
    expect(sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0]))).toBe('image/jpeg');
    expect(sniffImage(new TextEncoder().encode('<html>'))).toBeNull();
  });
  test('conjures, stores, and derived songs inherit the cover', async () => {
    const { conjureCover, inheritCover } = await import('./cover');
    const webp = new Uint8Array(4096);
    webp.set(
      Uint8Array.from('RIFF', (c) => c.charCodeAt(0)),
      0
    );
    webp.set(
      Uint8Array.from('WEBP', (c) => c.charCodeAt(0)),
      8
    );
    const { fetch, calls } = fakeFetch((url) => {
      if (url.includes('flux-schnell'))
        return Response.json(
          { id: pid, status: 'succeeded', output: ['https://replicate.delivery/c.webp'] },
          { status: 201 }
        );
      return new Response(webp);
    });
    const lib = new SongLibrary(root);
    const { id } = await lib.reserve();
    await lib.save({
      id,
      title: 'T',
      prompt: 'p',
      style_tags: [],
      lyrics: null,
      engine: 'e',
      params: {},
      created_at: '2026-11-06T00:00:00.000Z',
      parent_id: null,
      kind: 'original',
      favourite: false,
      audio: null,
      est_cost_usd: 0
    });
    const song = await conjureCover(lib, { token: 't', fetch }, id);
    expect(song.cover).toEqual({ file: 'cover.webp', content_type: 'image/webp', bytes: 4096 });
    expect((await lib.coverFile(id)).size).toBe(4096);
    expect(JSON.parse(String(calls[0].init?.body)).input.output_format).toBe('webp');
    const child = await lib.reserve();
    expect(await inheritCover(lib, id, child.dir)).toEqual({
      file: 'cover.webp',
      content_type: 'image/webp',
      bytes: 4096,
      inherited_from: id
    });
    expect(await inheritCover(lib, null, child.dir)).toBeUndefined();
  });
});

describe('security limits', () => {
  test('capped reads refuse oversized bodies', async () => {
    const { readCapped } = await import('./replicate');
    expect((await readCapped(new Response(new Uint8Array(10)), 10)).length).toBe(10);
    expect(readCapped(new Response(new Uint8Array(11)), 10)).rejects.toThrow(ProviderError);
    expect(
      readCapped(new Response('x', { headers: { 'content-length': '999' } }), 10)
    ).rejects.toThrow(ProviderError);
  });
  test('paid work is refused while 3 jobs are running', async () => {
    const { fetch } = fakeFetch(() =>
      Response.json({ id: pid, status: 'starting' }, { status: 201 })
    );
    const ctx = deps(fetch);
    for (let i = 0; i < 3; i += 1) await createSongs(ctx, request);
    expect(createSongs(ctx, request)).rejects.toMatchObject({ status: 429 });
  });
});

test('only localhost hosts pass the rebinding guard', () => {
  expect(isLocalHost('127.0.0.1:5414')).toBe(true);
  expect(isLocalHost('localhost:5414')).toBe(true);
  expect(isLocalHost('evil.example:5414')).toBe(false);
  expect(isLocalHost('127.0.0.1.evil.example')).toBe(false);
  expect(isLocalHost(null)).toBe(false);
});

describe('summon in my voice', () => {
  const session = '36b41abb-2c9c-43bb-b3e3-a298abf3482a';
  test('gold vocal: newest gold version, path-safe, explicit when missing', async () => {
    const { goldVocalFile } = await import('./gold');
    await writeVoice(voiceId(1), { consent: { ...consent, session_id: session } });
    const [voice] = await readVoices(root);
    expect(goldVocalFile(root, voice)).rejects.toMatchObject({ status: 404 });
    const dir = path.join(root, 'vocal-fix', 'sessions', session);
    await mkdir(path.join(dir, 'derived'), { recursive: true });
    await writeFile(path.join(dir, 'derived', 'gold.gold.v2.wav'), wav());
    await writeFile(
      path.join(dir, 'manifest.json'),
      JSON.stringify({
        versions: [
          { kind: 'gold', file: 'gold.gold.v1.wav', created_at: '2026-01-01' },
          { kind: 'gold', file: 'gold.gold.v2.wav', created_at: '2026-02-01' },
          { kind: 'gold', file: '../../../../etc/passwd', created_at: '2026-03-01' }
        ]
      })
    );
    expect(await goldVocalFile(root, voice)).toBe(path.join(dir, 'derived', 'gold.gold.v2.wav'));
    expect(
      goldVocalFile(root, { ...voice, consent: { ...voice.consent, session_id: '../x' } })
    ).rejects.toMatchObject({ status: 422 });
  });
  test('music-01 lyrics drop section tags and fit 380 characters', async () => {
    const { music01Lyrics } = await import('./voicesummon');
    expect(music01Lyrics('[Verse]\nA line here\n[Chorus]\nAnother line')).toBe(
      'A line here\nAnother line'
    );
    expect(music01Lyrics('word word word\n'.repeat(60)).length).toBeLessThanOrEqual(380);
  });
  test('unusable voices are refused before any paid call', async () => {
    const { findVoice } = await import('./voicesummon');
    await writeVoice(voiceId(2), { status: 'training' });
    expect(findVoice(root, voiceId(2))).rejects.toMatchObject({ status: 422 });
    expect(validateCreateSongRequest({ ...request, voice_id: voiceId(2) })).toContain(
      'music reference'
    );
  });
});
