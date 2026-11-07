import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CreateSongRequest, SongMeta } from '@vbm/contracts';
import type { CreateDeps } from './create';
import { SongLibrary } from './library';
import { ffmpegPath, makeInstrumental, makeReference, masterFile } from './master';
import { usableVoices } from './voices';

// Real ffmpeg for mastering and reference excerpts; providers are faked.
type Call = { url: string; body: string };
function fakeFetch(handler: (url: string) => Response) {
  const calls: Call[] = [];
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), body: typeof init?.body === 'string' ? init.body : '' });
    return handler(String(input));
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

async function tone(file: string, filter: string, seconds: number) {
  const proc = Bun.spawn(
    [
      ffmpegPath,
      '-hide_banner',
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      `${filter}:d=${seconds}`,
      '-ac',
      '2',
      '-c:a',
      'pcm_s16le',
      file
    ],
    { stdout: 'ignore', stderr: 'pipe' }
  );
  if ((await proc.exited) !== 0) throw new Error(await new Response(proc.stderr).text());
}

async function durationOf(file: string): Promise<number> {
  const proc = Bun.spawn([ffmpegPath, '-hide_banner', '-i', file, '-f', 'null', '-'], {
    stdout: 'ignore',
    stderr: 'pipe'
  });
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  const [, h, m, s] = /time=(\d+):(\d+):([\d.]+)/.exec(err.split('\n').reverse().join('\n')) ?? [];
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

const isMp3 = (b: Uint8Array) =>
  (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
const sha = async (f: string) =>
  createHash('sha256')
    .update(await readFile(f))
    .digest('hex');
const dataUriBytes = (uri: string) => {
  expect(uri.startsWith('data:audio/mpeg;base64,')).toBe(true);
  return new Uint8Array(Buffer.from(uri.split(',')[1], 'base64'));
};

let fixtures = '';
let quiet = '';
let silent = '';
beforeAll(async () => {
  fixtures = await mkdtemp(path.join(tmpdir(), 'vbm-derive-fx-'));
  quiet = path.join(fixtures, 'quiet.wav');
  silent = path.join(fixtures, 'silent.wav');
  // Quiet pink noise, far below the -14 LUFS target, and long enough to need trimming to 30 s.
  await tone(quiet, 'anoisesrc=color=pink:amplitude=0.02:seed=7', 34);
  await tone(silent, 'anullsrc=r=44100:cl=stereo', 5);
});
afterAll(async () => {
  if (fixtures.includes('vbm-derive-fx-')) await rm(fixtures, { recursive: true, force: true });
});

let root = '';
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-derive-'));
});
afterEach(async () => {
  if (root.includes('vbm-derive-')) await rm(root, { recursive: true, force: true });
});

function deps(fetch: typeof globalThis.fetch, extra: Partial<CreateDeps> = {}): CreateDeps {
  return {
    library: new SongLibrary(root),
    replicate: { token: 'tok', fetch },
    fal: null,
    gemini: null,
    fetch,
    now: () => new Date('2026-11-07T12:00:00Z'),
    ...extra
  };
}

async function addSong(ctx: CreateDeps, source: string, extra: Partial<SongMeta> = {}) {
  const { id, dir } = await ctx.library.reserve();
  await writeFile(path.join(dir, 'audio.wav'), await readFile(source));
  const meta: SongMeta = {
    id,
    title: 'Parent',
    prompt: 'gothic synth-pop',
    style_tags: ['gothic'],
    lyrics: '[Verse]\nCandles burn beneath the moon\n[Chorus]\nRise, the night is ours',
    engine: 'e',
    params: {},
    created_at: '2026-11-06T00:00:00.000Z',
    parent_id: null,
    kind: 'original',
    favourite: false,
    audio: { file: 'audio.wav', content_type: 'audio/wav', bytes: Bun.file(source).size },
    est_cost_usd: 0,
    ...extra
  };
  await ctx.library.save(meta);
  return { meta, dir };
}

const pid = 'abc123def456ghi7';
const replicateCreate = (url: string) =>
  url.endsWith('/predictions')
    ? Response.json({ id: pid, status: 'starting' }, { status: 201 })
    : new Response('unexpected ' + url, { status: 500 });

describe('studio master (real ffmpeg)', () => {
  test('masters a quiet file to about -14 LUFS / -1 dBTP and leaves the input untouched', async () => {
    const before = await sha(quiet);
    const out = path.join(root, 'master.wav');
    const report = await masterFile(quiet, out);
    expect(report.input_lufs).toBeLessThan(-25);
    expect(Math.abs(report.output_lufs - -14)).toBeLessThan(1.5);
    expect(report.output_true_peak).toBeLessThanOrEqual(-0.5);
    expect(new TextDecoder().decode((await readFile(out)).subarray(0, 4))).toBe('RIFF');
    expect(await sha(quiet)).toBe(before);
  }, 60_000);

  test('references and instrumental mixes are 30 s MP3 excerpts', async () => {
    const ref = path.join(root, 'ref.mp3');
    await makeReference(quiet, ref);
    expect(isMp3(new Uint8Array(await readFile(ref)))).toBe(true);
    expect(Math.abs((await durationOf(ref)) - 30)).toBeLessThan(0.5);
    const mix = path.join(root, 'mix.mp3');
    await makeInstrumental([quiet, quiet, quiet], mix);
    expect(isMp3(new Uint8Array(await readFile(mix)))).toBe(true);
    expect(Math.abs((await durationOf(mix)) - 30)).toBeLessThan(0.5);
  }, 60_000);

  test('masterSong stores a new child song; silent audio fails cleanly and stores nothing', async () => {
    const { fetch, calls } = fakeFetch(() => new Response('no network', { status: 500 }));
    const ctx = deps(fetch);
    const { masterSong } = await import('./derive');
    const { meta: parent, dir } = await addSong(ctx, quiet);
    const before = await sha(path.join(dir, 'audio.wav'));
    const child = await masterSong(ctx, parent.id);
    expect(child).toMatchObject({ kind: 'master', parent_id: parent.id, est_cost_usd: 0 });
    expect(Math.abs((child.master?.output_lufs ?? 0) - -14)).toBeLessThan(1.5);
    expect((await ctx.library.get(child.id)).audio.file).toBe('audio.wav');
    expect(await sha(path.join(dir, 'audio.wav'))).toBe(before);
    expect(calls).toEqual([]);

    const { meta: hush } = await addSong(ctx, silent);
    const songs = (await ctx.library.list()).length;
    const error = await masterSong(ctx, hush.id).catch((e) => e);
    expect(error.status).toBe(500);
    expect((await ctx.library.list()).length).toBe(songs);
  }, 60_000);
});

describe('paid derive paths (providers faked)', () => {
  test('reimagine sends an inline MP3 excerpt and tag-free lyrics; refuses before paying when it cannot', async () => {
    const { fetch, calls } = fakeFetch(replicateCreate);
    const ctx = deps(fetch);
    const { startReimagine } = await import('./derive');
    const { meta: parent } = await addSong(ctx, quiet);
    const job = await startReimagine(ctx, parent.id, { lyrics: null, title: null });
    expect(job.kind).toBe('reimagine');
    const create = calls.find((c) => c.url.endsWith('/predictions'));
    const input = JSON.parse(create?.body ?? '{}').input;
    expect(isMp3(dataUriBytes(input.song_file))).toBe(true);
    expect(input.lyrics).toBe('Candles burn beneath the moon\n\nRise, the night is ours');
    expect(create?.url).toContain('minimax/music-01');

    calls.length = 0;
    const { meta: bare } = await addSong(ctx, quiet, { lyrics: null });
    await expect(startReimagine(ctx, bare.id, { lyrics: null, title: null })).rejects.toMatchObject(
      {
        status: 422
      }
    );
    await expect(
      startReimagine(deps(fetch, { replicate: null }), parent.id, { lyrics: null, title: null })
    ).rejects.toMatchObject({ status: 503 });
    expect(calls).toEqual([]);
  }, 60_000);

  test('summon in my voice sends the Gold Vocal and the stems mix, and records consent', async () => {
    const session = '36b41abb-2c9c-43bb-b3e3-a298abf3482a';
    const voiceId = 'voice-00000001-0000-4000-8000-000000000000';
    const consent = {
      own_voice: true,
      attested_name: 'Ada',
      statement: 'My voice',
      attested_at: '2026-11-01T00:00:00Z',
      session_id: session
    };
    await mkdir(path.join(root, 'shared', 'voices'), { recursive: true });
    await writeFile(
      path.join(root, 'shared', 'voices', voiceId + '.json'),
      JSON.stringify({
        id: voiceId,
        performer: 'Ada',
        status: 'ready',
        created_at: '2026-11-01T00:00:00Z',
        consent,
        provider: 'replicate',
        model_url: 'https://replicate.delivery/m.zip'
      })
    );
    const sdir = path.join(root, 'vocal-fix', 'sessions', session);
    await mkdir(path.join(sdir, 'derived'), { recursive: true });
    await writeFile(path.join(sdir, 'derived', 'gold.gold.v1.wav'), await readFile(quiet));
    await writeFile(
      path.join(sdir, 'manifest.json'),
      JSON.stringify({
        versions: [{ kind: 'gold', file: 'gold.gold.v1.wav', created_at: '2026-01-01' }]
      })
    );

    const { fetch, calls } = fakeFetch(replicateCreate);
    const ctx = deps(fetch);
    const { meta: song } = await addSong(ctx, quiet);
    const { dir: stemsDir } = await addSong(ctx, quiet, {
      kind: 'stems',
      parent_id: song.id,
      stems: (['vocals', 'drums', 'bass', 'other'] as const).map((name) => ({
        name,
        file: `stems/${name}.wav`,
        content_type: 'audio/wav',
        bytes: Bun.file(quiet).size
      }))
    });
    await mkdir(path.join(stemsDir, 'stems'), { recursive: true });
    for (const name of ['vocals', 'drums', 'bass', 'other'])
      await writeFile(path.join(stemsDir, 'stems', name + '.wav'), await readFile(quiet));

    const [voice] = await usableVoices(root);
    const { submitVoiceSummon } = await import('./voicesummon');
    const request: CreateSongRequest = {
      mode: 'custom',
      prompt: 'Haunted gothic synth-pop',
      title: 'Night Rite',
      lyrics: '[Verse]\nCandles burn beneath the moon',
      style_tags: [],
      instrumental: false,
      engine: 'minimax-music-1.5',
      duration_seconds: null,
      sound_character: 'clean',
      takes: 2,
      voice_id: voiceId,
      reference_song_id: song.id
    };
    const plan = {
      title: 'Night Rite',
      prompt: 'p',
      style_tags: [],
      lyrics: request.lyrics,
      engine: 'minimax-music-1.5',
      params: { lyrics_written_by_ai: false },
      parent_id: null,
      kind: 'original' as const,
      est_cost_usd: 0
    };
    const out = await submitVoiceSummon(ctx, ctx.replicate!, request, voice, request.lyrics!, plan);
    expect(out.tasks).toHaveLength(2);
    const input = JSON.parse(calls.find((c) => c.url.endsWith('/predictions'))?.body ?? '{}').input;
    expect(isMp3(dataUriBytes(input.voice_file))).toBe(true);
    expect(isMp3(dataUriBytes(input.instrumental_file))).toBe(true);
    expect(input.lyrics).toBe('Candles burn beneath the moon');
    expect(out.plan.params.instrumental_reference).toBe(
      'stems of ' + (await ctx.library.list()).find((s) => s.kind === 'stems')?.id
    );
    expect(out.plan.voice).toEqual({
      voice_id: voiceId,
      performer: 'Ada',
      consent_ref: session,
      attested_at: consent.attested_at
    });
  }, 60_000);

  test('Lyria 3.5 stores each verified take and finishes the job without polling', async () => {
    const mp3 = new Uint8Array(4096);
    mp3.set([0x49, 0x44, 0x33]);
    const data = Buffer.from(mp3).toString('base64');
    const { fetch, calls } = fakeFetch((url) =>
      url.includes('generativelanguage.googleapis.com')
        ? Response.json({
            steps: [
              {
                type: 'model_output',
                content: [
                  { type: 'text', text: '[Verse] words' },
                  { type: 'audio', data }
                ]
              }
            ]
          })
        : new Response('unexpected ' + url, { status: 500 })
    );
    const ctx = deps(fetch, { replicate: null, gemini: { apiKey: 'g', fetch } });
    const { createSongs } = await import('./create');
    const result = await createSongs(ctx, {
      mode: 'simple',
      prompt: 'A slow gothic ballad about candles',
      title: '',
      lyrics: null,
      style_tags: [],
      instrumental: false,
      engine: 'lyria-3.5',
      duration_seconds: 60,
      sound_character: 'clean',
      takes: 2
    });
    expect(result.job.status).toBe('completed');
    expect(result.job.song_ids).toHaveLength(2);
    expect(calls.filter((c) => c.url.includes('generativelanguage'))).toHaveLength(2);
    for (const id of result.job.song_ids) {
      const song = await ctx.library.get(id);
      expect(song.lyrics).toBe('[Verse] words');
      expect(song.audio.content_type).toBe('audio/mpeg');
    }
  });
});
