import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { SliceRequest, SongMeta } from '@vbm/contracts';
import { SongLibrary } from '../studio/library';
import { render } from './fixtures.test-util';
import { parseSilences, regionsBetween, silenceArgs, sliceArgs, sliceSounds } from './slice';
import { SoundLibrary } from './sounds';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-slice-test-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

// Three 0.3 s beeps separated by 0.4 s of silence.
const beeps = "sine=f=440:d=2,volume='if(lt(mod(t,0.7),0.3),0.8,0)':eval=frame";

async function addSong(songs: SongLibrary, extra: Partial<SongMeta> = {}): Promise<SongMeta> {
  const { id, dir } = await songs.reserve();
  await render(path.join(dir, 'song.wav'), beeps);
  const meta: SongMeta = {
    id,
    title: 'Night Rite',
    prompt: 'p',
    style_tags: [],
    lyrics: null,
    engine: 'minimax-music-1.5',
    params: {},
    created_at: '2026-11-08T00:00:00Z',
    parent_id: null,
    kind: 'original',
    favourite: false,
    audio: { file: 'song.wav', content_type: 'audio/wav', bytes: 1 },
    est_cost_usd: 0,
    runner: {
      model: 'ace-step-1.5',
      runner: 'fal',
      model_version: 'x',
      license: 'Apache-2.0',
      commercial: true,
      attempts: []
    },
    ...extra
  };
  await songs.save(meta);
  return meta;
}

const req = (extra: Partial<SliceRequest>): SliceRequest => ({
  from: 'song',
  mode: 'manual',
  start_seconds: 0,
  end_seconds: 0.3,
  name: 'Beep',
  category: 'synth',
  ...extra
});

describe('slice arguments and silence parsing (pure)', () => {
  test('cuts with atrim, never a shell string', () => {
    const args = sliceArgs('a b.wav', { start: 1, end: 2.5 }, 'o.wav');
    expect(args).toContain('a b.wav');
    expect(args).toContain('atrim=start=1.0000:end=2.5000,asetpts=PTS-STARTPTS');
    expect(silenceArgs('x', { start: 0, end: 2 }).join(' ')).toContain('silencedetect=noise=-40dB');
  });

  test('regions lie between silences, offset into the song, capped at 64 and 30 s', () => {
    const silences = parseSilences(
      '[silencedetect] silence_start: 0.3\n[silencedetect] silence_end: 0.7 | silence_duration: 0.4\n' +
        '[silencedetect] silence_start: 1.0\n'
    );
    expect(silences).toEqual([
      { start: 0.3, end: 0.7 },
      { start: 1, end: Infinity }
    ]);
    expect(regionsBetween(silences, 2, 10)).toEqual([
      { start: 10, end: 10.3 },
      { start: 10.7, end: 11 }
    ]);
    const many = Array.from({ length: 100 }, (_, i) => ({ start: i + 0.5, end: i + 1 }));
    expect(regionsBetween(many, 100, 0)).toHaveLength(64);
    expect(regionsBetween([], 100, 0)).toEqual([{ start: 0, end: 30 }]);
  });
});

describe('sliceSounds (real ffmpeg)', () => {
  test('manual slice records the song and its runner licence', async () => {
    const songs = new SongLibrary(root);
    const sounds = new SoundLibrary(root);
    const song = await addSong(songs);
    const [sound] = await sliceSounds({ songs, sounds }, req({ song_id: song.id }));
    expect(sound.duration_seconds).toBeCloseTo(0.3, 1);
    expect(sound.source).toEqual({
      kind: 'slice',
      song_id: song.id,
      song_title: 'Night Rite',
      stem: 'main',
      start_seconds: 0,
      end_seconds: 0.3,
      license: 'Apache-2.0',
      commercial: true
    });
  }, 30_000);

  test('auto slice finds each beep', async () => {
    const songs = new SongLibrary(root);
    const sounds = new SoundLibrary(root);
    const song = await addSong(songs, { runner: undefined });
    const made = await sliceSounds(
      { songs, sounds },
      req({ song_id: song.id, mode: 'auto', end_seconds: 2 })
    );
    expect(made.map((s) => s.name)).toEqual(['Beep 1', 'Beep 2', 'Beep 3']);
    expect(made[1].source).toMatchObject({ license: null, commercial: null });
    expect((made[1].source as { start_seconds: number }).start_seconds).toBeCloseTo(0.7, 1);
  }, 30_000);

  test('a missing stem, a sealed séance take or a non-consented voice is refused', async () => {
    const songs = new SongLibrary(root);
    const sounds = new SoundLibrary(root);
    const song = await addSong(songs);
    await expect(
      sliceSounds({ songs, sounds }, req({ song_id: song.id, stem: 'drums' }))
    ).rejects.toMatchObject({
      status: 404
    });
    const sealed = await addSong(songs, { seance_id: '00000000-0000-4000-8000-000000000001' });
    await expect(sliceSounds({ songs, sounds }, req({ song_id: sealed.id }))).rejects.toMatchObject(
      {
        status: 409
      }
    );

    const session = '36b41abb-2c9c-43bb-b3e3-a298abf3482a';
    const voiceId = 'voice-00000001-0000-4000-8000-000000000000';
    const voice = {
      id: voiceId,
      performer: 'Ada',
      status: 'ready',
      created_at: '2026-11-01T00:00:00Z',
      consent: {
        own_voice: true,
        attested_name: 'Ada',
        statement: 'My voice',
        attested_at: '2026-11-01T00:00:00Z',
        session_id: session
      },
      provider: 'replicate',
      model_url: 'https://replicate.delivery/m.zip'
    };
    await mkdir(path.join(root, 'shared', 'voices'), { recursive: true });
    const voiceFile = path.join(root, 'shared', 'voices', voiceId + '.json');
    await writeFile(voiceFile, JSON.stringify({ ...voice, status: 'training' }));
    const gold = req({ from: 'gold', voice_id: voiceId });
    await expect(sliceSounds({ songs, sounds }, gold)).rejects.toMatchObject({ status: 403 });

    await writeFile(voiceFile, JSON.stringify(voice));
    const derived = path.join(root, 'vocal-fix', 'sessions', session, 'derived');
    await mkdir(derived, { recursive: true });
    await render(path.join(derived, 'gold.gold.v1.wav'), 'sine=f=330:d=1');
    const [sound] = await sliceSounds({ songs, sounds }, gold);
    expect(sound.source).toMatchObject({ kind: 'gold', voice_id: voiceId, consent_ref: session });
    expect(await readFile(path.join(sounds.soundDir(sound.id), 'sound.wav'))).toBeTruthy();
    expect((await sounds.list()).length).toBe(1);
  }, 30_000);
});
