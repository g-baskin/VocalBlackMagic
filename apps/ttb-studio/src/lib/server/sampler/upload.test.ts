import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { render } from './fixtures.test-util';
import { SoundLibrary } from './sounds';
import { readBody, rightsHeader, rightsStatement, storeUpload, uploadFields } from './upload';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-upload-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const url = (q: string) => new URL('http://localhost/api/studio/sounds/upload?' + q);
const req = (headers: Record<string, string> = {}, body?: BodyInit) =>
  new Request('http://localhost/', { method: 'POST', headers, body });

describe('uploads', () => {
  test('the rights attestation and fields are required', () => {
    const q = 'name=Kick&category=drum&attested_name=Ada%20Lovelace&original_name=kick.wav';
    expect(uploadFields(req(), url(q))).toMatch(/rights/);
    const ok = req({ [rightsHeader]: rightsStatement });
    expect(uploadFields(ok, url(q))).toEqual({
      name: 'Kick',
      category: 'drum',
      attested_name: 'Ada Lovelace',
      original_name: 'kick.wav'
    });
    expect(uploadFields(ok, url('name=Kick&category=drum'))).toMatch(/full name/);
    expect(uploadFields(ok, url('name=Kick&category=kazoo&attested_name=Ada'))).toMatch(/category/);
  });

  test('bodies over the cap are refused by declared and by actual length', async () => {
    await expect(readBody(req({ 'content-length': '999' }, 'x'), 10)).rejects.toMatchObject({
      status: 413
    });
    await expect(readBody(req({}, new Uint8Array(11)), 10)).rejects.toMatchObject({ status: 413 });
    expect((await readBody(req({}, new Uint8Array(10)), 10)).length).toBe(10);
  });

  test('a stored upload records the sha256 and who attested', async () => {
    const bytes = await render(path.join(root, 'k.wav'), 'sine=f=60:d=0.4');
    const sound = await storeUpload(
      new SoundLibrary(root),
      { name: 'Kick', category: 'drum', attested_name: 'Ada', original_name: 'k.wav' },
      bytes,
      new Date('2026-11-08T00:00:00Z')
    );
    expect(sound.source).toEqual({
      kind: 'upload',
      sha256: new Bun.CryptoHasher('sha256').update(bytes).digest('hex'),
      original_name: 'k.wav',
      attested_name: 'Ada',
      attested_at: '2026-11-08T00:00:00.000Z'
    });
  });
});
