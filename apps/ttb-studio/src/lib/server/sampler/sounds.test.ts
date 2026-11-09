import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { SoundSource } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { LibraryError } from '../studio/library';
import { analyse, autoTags, decodeArgs, hitPoint, playableArgs } from './analyse';
import { render, riser } from './fixtures.test-util';
import { cleanTags, SoundLibrary } from './sounds';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-sounds-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const upload: SoundSource = {
  kind: 'upload',
  sha256: 'ab'.repeat(32),
  original_name: 'hit.wav',
  attested_name: 'Me',
  attested_at: '2026-11-08T00:00:00.000Z'
};

describe('analysis (pure)', () => {
  test('the hit is the loudest 10 ms window', () => {
    const s = new Float32Array(22050);
    for (let i = 0; i < s.length; i++) s[i] = 0.01 * Math.sin(i / 3);
    for (let i = 15435; i < 15655; i++) s[i] = 0.9;
    expect(hitPoint(s)).toBeCloseTo(0.7, 1);
  });

  test('features and tags describe the sound', () => {
    const tone = new Float32Array(22050).map(
      (_, i) => 0.5 * Math.sin((2 * Math.PI * 220 * i) / 22050)
    );
    const a = analyse(tone);
    expect(a.duration_seconds).toBeCloseTo(1, 3);
    expect(a.features.peak_db).toBeCloseTo(-6, 0);
    expect(a.features.centroid_hz).toBeLessThan(1200);
    expect(a.features.thumb).toHaveLength(48);
    expect(autoTags(a.features)).toEqual(expect.arrayContaining(['dark', 'tonal', 'huge']));
    let seed = 1;
    const noise = new Float32Array(22050).map(() => {
      seed = (seed * 16807) % 2147483647;
      return 0.05 * (seed / 2147483647 - 0.5);
    });
    const n = analyse(noise);
    expect(autoTags(n.features)).toEqual(
      expect.arrayContaining(['bright', 'airy', 'noisy', 'soft'])
    );
  });

  test('ffmpeg commands are argument arrays with a strict full decode', () => {
    expect(decodeArgs('in; rm -rf /')).toContain('in; rm -rf /');
    expect(decodeArgs('x')).toContain('-xerror');
    expect(playableArgs('a', 'b').slice(-7)).toEqual([
      '-ac',
      '2',
      '-ar',
      '44100',
      '-c:a',
      'pcm_s16le',
      'b'
    ]);
  });
});

describe('SoundLibrary (real ffmpeg)', () => {
  test('keeps the original, writes a 44.1 kHz WAV and finds the hit', async () => {
    const bytes = await render(path.join(root, 'in.wav'), riser(1.2, 2), ['-ar', '22050']);
    const lib = new SoundLibrary(root, () => new Date('2026-11-08T00:00:00Z'));
    const meta = await lib.add({ bytes, name: ' Riser ', category: 'transition', source: upload });
    expect(meta.name).toBe('Riser');
    expect(meta.hit_seconds).toBeGreaterThan(1.15);
    expect(meta.hit_seconds).toBeLessThan(1.26);
    expect(meta.duration_seconds).toBeCloseTo(2, 1);
    const dir = lib.soundDir(meta.id);
    expect((await readdir(dir)).sort()).toEqual(['meta.json', 'original.wav', 'sound.wav']);
    expect(new Uint8Array(await readFile(path.join(dir, 'original.wav')))).toEqual(bytes);
    const wav = new DataView((await readFile(path.join(dir, 'sound.wav'))).buffer);
    expect(wav.getUint32(24, true)).toBe(44100);
    expect((await lib.audioFile(meta.id)).size).toBe(meta.audio.bytes);
    expect(await lib.get(meta.id)).toEqual(meta);
  });

  test('list filters, update edits and remove deletes', async () => {
    const lib = new SoundLibrary(root);
    const a = await lib.add({
      bytes: await render(path.join(root, 'a.wav'), 'sine=f=200:d=0.5'),
      name: 'Low boom',
      category: 'impact',
      source: upload
    });
    await lib.add({
      bytes: await render(path.join(root, 'b.wav'), 'anoisesrc=d=0.5:a=0.3'),
      name: 'Hiss',
      category: 'ambience',
      source: upload
    });
    expect((await lib.list()).map((s) => s.name)).toEqual(['Hiss', 'Low boom']);
    expect((await lib.list({ category: 'impact' })).map((s) => s.name)).toEqual(['Low boom']);
    expect((await lib.list({ q: 'noisy' })).map((s) => s.name)).toEqual(['Hiss']);
    await lib.update(a.id, { favourite: true, tags: ['kick'] });
    expect((await lib.list({ favourite: true })).map((s) => s.name)).toEqual(['Low boom']);
    await expect(lib.update(a.id, { name: ' ' })).rejects.toBeInstanceOf(LibraryError);
    await lib.remove(a.id);
    await expect(lib.get(a.id)).rejects.toMatchObject({ status: 404 });
    await expect(lib.get('../../etc')).rejects.toMatchObject({ status: 404 });
  });

  test('refuses non-audio, silence and sounds over 30 seconds, leaving nothing behind', async () => {
    const lib = new SoundLibrary(root);
    const fake = new TextEncoder().encode('RIFF....WAVEnot really audio at all '.repeat(100));
    await expect(
      lib.add({ bytes: fake, name: 'x', category: 'pad', source: upload })
    ).rejects.toMatchObject({
      status: 422
    });
    await expect(
      lib.add({ bytes: new Uint8Array(2048), name: 'x', category: 'pad', source: upload })
    ).rejects.toMatchObject({ status: 415 });
    const silent = await render(path.join(root, 's.wav'), 'anullsrc=d=1');
    await expect(
      lib.add({ bytes: silent, name: 'x', category: 'pad', source: upload })
    ).rejects.toThrow('silent');
    const long = await render(path.join(root, 'l.wav'), 'sine=f=300:d=31', ['-ar', '8000']);
    await expect(
      lib.add({ bytes: long, name: 'x', category: 'pad', source: upload })
    ).rejects.toBeInstanceOf(ProviderError);
    expect(await lib.list()).toEqual([]);
    expect(await readdir(lib.soundsDir)).toEqual([]);
  });

  test('tags are cleaned and bounded', () => {
    expect(cleanTags([' Dark ', 'dark', 'big hit'])).toEqual(['dark', 'big hit']);
    expect(cleanTags(['<script>'])).toBeNull();
    expect(cleanTags(new Array(13).fill('a'))).toBeNull();
    expect(cleanTags('dark')).toBeNull();
  });
});
