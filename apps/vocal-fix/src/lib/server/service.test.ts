import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_STATEMENT } from './forge';
import { ffmpeg } from './media';
import { VocalFixService } from './service';

// Real ffmpeg for intake, repair and Gold Vocal assembly; only Replicate is mocked.
const PERFORMER = 'Test Voice';
let root = '';
const takes: Uint8Array[] = [];
// A data dir holding one repaired forge session; each test works on its own copy.
let template = '';
let templateId = '';

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'vbm-vf-test-service-'));
  for (let i = 0; i < 5; i++) {
    const out = join(root, `take-${i}.wav`);
    // Two 1.8 s phrases split by silence, so the Gold Vocal has phrases to rank.
    await ffmpeg([
      '-f',
      'lavfi',
      '-i',
      `sine=f=${220 + i * 20}:d=4.5,volume=0.3,volume=enable=between(t\\,1.8\\,2.7):volume=0`,
      '-c:a',
      'pcm_s16le',
      out
    ]);
    takes.push(new Uint8Array(await readFile(out)));
  }
  template = await mkdtemp(join(root, 'template-'));
  const svc = new VocalFixService(
    template,
    () => null,
    fetch,
    () => new Date(0),
    1
  );
  const m = await svc.intake({
    mode: 'forge',
    performer: PERFORMER,
    acknowledged_rights: true,
    files: takes.map((bytes, i) => ({ name: `take-${i}.wav`, bytes }))
  });
  await svc.startRepair(m.id, { preset: 'natural' });
  await svc.jobs.idle(m.id, 60_000);
  templateId = m.id;
}, 120_000);
afterAll(async () => {
  if (root.includes('vbm-vf-test-service-')) await rm(root, { recursive: true, force: true });
});

interface FakeReplicate {
  fetch: typeof fetch;
  calls: string[];
}

function fakeReplicate(): FakeReplicate {
  const calls: string[] = [];
  const model = new Uint8Array(4096).fill(7);
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('/files'))
      return Response.json({ urls: { get: 'https://api.replicate.com/v1/files/ds' } });
    if (url.endsWith('/predictions'))
      return Response.json({
        id: 'p1',
        status: 'succeeded',
        output: 'https://replicate.delivery/m.zip'
      });
    if (url === 'https://replicate.delivery/m.zip') return new Response(model);
    return new Response('unexpected ' + url, { status: 500 });
  }) as unknown as typeof fetch;
  return { fetch: fetchImpl, calls };
}

async function service(token: string | null, fake = fakeReplicate()) {
  const dir = await mkdtemp(join(root, 'data-'));
  await cp(template, dir, { recursive: true });
  const svc = new VocalFixService(
    dir,
    () => token,
    fake.fetch,
    () => new Date(0),
    1
  );
  return { svc, fake, id: templateId };
}

const exists = (p: string) =>
  stat(p).then(
    () => true,
    () => false
  );

describe('Vocal Fix service: gold, consent, revoke and delete', () => {
  test('gold refuses unrepaired takes, then assembles a verified Gold Vocal with provenance', async () => {
    const { svc, id } = await service(null);
    const raw = await svc.intake({
      mode: 'forge',
      performer: PERFORMER,
      acknowledged_rights: true,
      files: takes.map((bytes, i) => ({ name: `take-${i}.wav`, bytes }))
    });
    await expect(svc.gold(raw.id, {})).rejects.toThrow('Repair every take');

    const gold = await svc.gold(id, {});
    expect(gold.selected.length).toBeGreaterThan(0);
    expect(gold.version.kind).toBe('gold');
    expect(gold.version.diagnosis).toBeTruthy();
    const m = await svc.store.read(id);
    expect(m.gold).toBeTruthy();
    const sidecar = JSON.parse(
      await readFile(
        svc.store.filePath(id, 'derived', gold.version.file.replace(/\.wav$/, '.json')),
        'utf8'
      )
    );
    expect(sidecar.segments.every((s: { source_sha256?: string }) => !!s.source_sha256)).toBe(true);
  }, 120_000);

  test('forge refuses missing or mismatched consent before any paid call, then trains and seals', async () => {
    const { svc, fake, id } = await service('r8_test');
    await expect(svc.startForge(id, { own_voice: true, attested_name: PERFORMER })).rejects.toThrow(
      'Forge the Gold Vocal first'
    );
    await svc.gold(id, {});
    for (const body of [
      { own_voice: false, attested_name: PERFORMER },
      { own_voice: true, attested_name: 'Someone Else' },
      { own_voice: true, attested_name: PERFORMER, statement: 'I agree' }
    ])
      await expect(svc.startForge(id, body)).rejects.toMatchObject({ status: 403 });
    expect(fake.calls).toEqual([]);
    expect(await readdir(svc.registry.dir).catch(() => [])).toEqual([]);

    const { job, voice } = await svc.startForge(id, {
      own_voice: true,
      attested_name: 'test  voice',
      statement: CONSENT_STATEMENT
    });
    await svc.jobs.idle(id, 60_000);
    expect((await svc.jobs.get('', job.id)).status).toBe('completed');
    const sealed = await svc.registry.read(voice.id);
    expect(sealed.status).toBe('ready');
    expect(sealed.consent).toMatchObject({
      own_voice: true,
      session_id: id,
      statement: CONSENT_STATEMENT
    });
    expect(await exists(svc.registry.path(voice.id).replace(/\.json$/, '.model.zip'))).toBe(true);
    const audit = (await svc.store.read(id)).audit.map((a) => a.event);
    expect(audit).toContain('voice_consent');
  }, 120_000);

  test('revoking a voice removes its files and is audited; deleting a session removes its voices', async () => {
    const { svc, id } = await service('r8_test');
    await svc.gold(id, {});
    const consent = { own_voice: true, attested_name: PERFORMER };
    const first = await svc.startForge(id, consent);
    await svc.jobs.idle(id, 60_000);
    const second = await svc.startForge(id, consent);
    await svc.jobs.idle(id, 60_000);

    await svc.revokeVoice(first.voice.id);
    expect(await exists(svc.registry.path(first.voice.id))).toBe(false);
    expect(await exists(svc.registry.path(first.voice.id).replace(/\.json$/, '.model.zip'))).toBe(
      false
    );
    const m = await svc.store.read(id);
    expect(m.voices).toEqual([second.voice.id]);
    expect(m.audit.at(-1)).toMatchObject({
      event: 'voice_revoked',
      detail: { voice_id: first.voice.id }
    });

    await svc.remove(id);
    expect(await svc.store.exists(id)).toBe(false);
    expect(await exists(svc.registry.path(second.voice.id))).toBe(false);
    expect(await exists(svc.registry.path(second.voice.id).replace(/\.json$/, '.model.zip'))).toBe(
      false
    );
    await expect(svc.store.read(id)).rejects.toMatchObject({ status: 404 });
  }, 120_000);

  test('hosted stages without a token are an explicit 503, never a fake start', async () => {
    const { svc } = await service(null);
    const m = await svc.intake({
      mode: 'fix',
      performer: PERFORMER,
      acknowledged_rights: true,
      files: [{ name: 'take.wav', bytes: takes[0] }]
    });
    await expect(svc.startRepair(m.id, { isolate: true })).rejects.toMatchObject({ status: 503 });
  });
});
