import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { analyzeProfile, describeProfile, framePitch } from './profile';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isVoiceModel, type VoiceModel } from '@vbm/contracts';
import {
  buildPolishChain,
  gainArgs,
  loudnessGainDb,
  MAX_MAKEUP_DB,
  polishArgs,
  presetIds,
  regressionFinding,
  regressions
} from './chain';
import { diagnoseFile, parseEbur128, parseSilences } from './diagnose';
import { VocalFixError } from './errors';
import { buildZip, CONSENT_STATEMENT, validateConsent, VoiceRegistry } from './forge';
import { guardMutation } from './gate';
import {
  assemblyArgs,
  layoutSegments,
  phrasesFromSilences,
  rankPhrases,
  selectPhrases,
  type PhraseCandidate
} from './gold';
import { FFMPEG, ffmpeg, parseProbe, probeAndVerify } from './media';
import { ReplicateClient, isAllowedOutputUrl } from './replicate';
import { SessionStore } from './storage';

let dir = '';
const gen = (name: string, filter: string) =>
  ffmpeg(['-f', 'lavfi', '-i', filter, '-c:a', 'pcm_s16le', join(dir, name)]);

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'vbm-vf-test-'));
  await gen('clean.wav', 'sine=f=220:d=3,volume=0.3');
  await gen('clipped.wav', 'sine=f=220:d=3,volume=20');
  await gen('gaps.wav', 'sine=f=330:d=6,volume=0.3,volume=enable=between(t\\,2\\,3.5):volume=0');
});
afterAll(async () => {
  if (dir.includes('vbm-vf-test-')) await rm(dir, { recursive: true, force: true });
});

describe('storage', () => {
  test('rejects traversal and bad ids', async () => {
    const store = new SessionStore(dir);
    expect(() => store.sessionDir('../etc')).toThrow(VocalFixError);
    const m = await store.create({
      mode: 'fix',
      performer: 'A B',
      created_at: 'x',
      consent: { acknowledged_rights: true, statement: 's', attested_at: 'x' },
      recordings: []
    });
    for (const bad of ['../manifest.json', '..', 'a/b.wav', '.hidden', '%2e%2e'])
      expect(() => store.filePath(m.id, 'derived', bad)).toThrow(VocalFixError);
    expect(store.filePath(m.id, 'derived', 'take-1.repair.v1.wav')).toContain(m.id);
  });
  test('delete removes everything', async () => {
    const store = new SessionStore(dir);
    const m = await store.create({
      mode: 'fix',
      performer: 'A B',
      created_at: 'x',
      consent: { acknowledged_rights: true, statement: 's', attested_at: 'x' },
      recordings: []
    });
    await writeFile(store.filePath(m.id, 'originals', 'take-1.wav'), 'x');
    await store.remove(m.id);
    expect(await store.exists(m.id)).toBe(false);
    await expect(stat(store.sessionDir(m.id))).rejects.toThrow();
    await expect(store.remove(m.id)).rejects.toThrow(VocalFixError);
  });
});

describe('ffprobe validation', () => {
  test('accepts a real WAV', async () => {
    const p = await probeAndVerify(join(dir, 'clean.wav'));
    expect(p.codec).toBe('pcm_s16le');
    expect(p.duration_seconds).toBeCloseTo(3, 1);
    expect(p.channels).toBe(1);
  });
  test('rejects garbage bytes', async () => {
    const bad = join(dir, 'garbage.wav');
    await writeFile(bad, new Uint8Array(4096).fill(7));
    await expect(probeAndVerify(bad)).rejects.toThrow(VocalFixError);
  });
  test('rejects a file that is corrupted partway through', async () => {
    const good = join(dir, 'tone.flac');
    await ffmpeg([
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=4',
      '-c:a',
      'flac',
      good
    ]);
    const bytes = new Uint8Array(await Bun.file(good).arrayBuffer());
    const middle = Math.floor(bytes.length / 2);
    for (let i = middle; i < Math.min(bytes.length, middle + 4096); i++) bytes[i] = (i * 37) & 0xff;
    const bad = join(dir, 'corrupt.flac');
    await writeFile(bad, bytes);
    await expect(probeAndVerify(bad)).rejects.toThrow('decode cleanly');
  });
  test('parseProbe rejects missing audio', () => {
    expect(() => parseProbe('{"streams":[]}')).toThrow('No audio stream');
  });
  test('uses a real ffmpeg', () => expect(FFMPEG.length).toBeGreaterThan(0));
});

describe('diagnosis', () => {
  test('finds clipping', async () => {
    const d = await diagnoseFile(join(dir, 'clipped.wav'), 3, new Date(0));
    expect(d.clipped_samples).toBeGreaterThan(0);
    expect(d.findings.some((f) => f.text.startsWith('Clipping at 0:0'))).toBe(true);
    expect(d.scores.clipping).toBeLessThan(1);
  });
  test('clean take has no clipping', async () => {
    const d = await diagnoseFile(join(dir, 'clean.wav'), 3, new Date(0));
    expect(d.clipped_samples).toBe(0);
    expect(d.loudness.integrated_lufs).not.toBeNull();
  });
  test('detects silence gaps', async () => {
    const d = await diagnoseFile(join(dir, 'gaps.wav'), 6, new Date(0));
    expect(d.silences.length).toBe(1);
    expect(d.silences[0].start).toBeCloseTo(2, 0);
    expect(d.silence_ratio).toBeGreaterThan(0.15);
  });
  test('parsers', () => {
    expect(
      parseEbur128('Summary:\n I: -18.2 LUFS\n LRA: 5.0 LU\n Peak: -1.3 dBFS').integrated_lufs
    ).toBe(-18.2);
    expect(parseSilences('silence_start: 1.5\nsilence_end: 2.5 | d', 4)).toEqual([
      { start: 1.5, end: 2.5 }
    ]);
    expect(parseSilences('silence_start: 3', 4)).toEqual([{ start: 3, end: 4 }]);
  });
});

describe('polish chain', () => {
  for (const id of presetIds)
    test(id + ' builds a valid chain that renders', async () => {
      const chain = buildPolishChain(id, { clipped_samples: 10, noise_floor_db: -45 });
      expect(chain.startsWith('adeclip,highpass=')).toBe(true);
      expect(chain).not.toContain('loudnorm');
      expect(chain).toContain('agate=');
      const out = join(dir, id + '.out.wav');
      await ffmpeg(polishArgs(join(dir, 'clean.wav'), out + '.p1.wav', chain));
      await ffmpeg(gainArgs(out + '.p1.wav', out, 3));
      expect((await probeAndVerify(out)).sample_rate).toBe(48000);
    });
  test('no declip without clipping', () =>
    expect(buildPolishChain('natural')).not.toContain('adeclip'));
});

describe('gold vocal', () => {
  const cand = (
    id: string,
    take: string,
    extra: Partial<PhraseCandidate> = {}
  ): PhraseCandidate => ({
    id,
    take_id: take,
    source_file: take + '.wav',
    start: 0,
    end: 3,
    rms_db: -20,
    peak: 0.5,
    clipped: 0,
    snr_db: 40,
    ...extra
  });
  test('phrases between silences', () => {
    expect(phrasesFromSilences([{ start: 2, end: 3.5 }], 6)).toEqual([
      { start: 0, end: 2 },
      { start: 3.5, end: 6 }
    ]);
  });
  test('ranking penalises clipping and noise; selection spans takes', () => {
    const ranked = rankPhrases([
      cand('a1', 'a'),
      cand('a2', 'a', { clipped: 5 }),
      cand('b1', 'b', { snr_db: 12 }),
      cand('b2', 'b')
    ]);
    expect(ranked.at(-1)?.id).toBe('a2');
    const sel = selectPhrases(ranked, { maxPhrases: 2 });
    expect(sel.map((p) => p.take_id)).toEqual(['a', 'b']);
    expect(
      selectPhrases(ranked, { excluded: ['a1'], included: ['a2'] }).map((p) => p.id)
    ).toContain('a2');
  });
  test('assembly concatenates with silence (no crossfade between takes)', async () => {
    const segs = layoutSegments([
      { ...cand('x', 'x', { start: 0, end: 1 }), source_file: 'clean.wav' },
      { ...cand('y', 'y', { start: 0, end: 2 }), source_file: 'gaps.wav' }
    ]);
    expect(segs[1].output_start).toBeCloseTo(1.35, 3);
    const out = join(dir, 'gold.wav');
    const args = assemblyArgs(
      new Map([
        ['clean.wav', join(dir, 'clean.wav')],
        ['gaps.wav', join(dir, 'gaps.wav')]
      ]),
      segs,
      out
    );
    expect(args.join(' ')).not.toContain('acrossfade');
    await ffmpeg(args);
    expect((await probeAndVerify(out)).duration_seconds).toBeCloseTo(3.35, 1);
  });
});

describe('consent + registry', () => {
  test('name mismatch rejected, match accepted', () => {
    expect(() =>
      validateConsent({ attested_name: 'Someone Else', own_voice: true }, 'Ada Lovelace')
    ).toThrow('must match');
    expect(() =>
      validateConsent({ attested_name: 'Ada Lovelace', own_voice: false }, 'Ada Lovelace')
    ).toThrow();
    expect(
      validateConsent({ attested_name: ' ada  lovelace ', own_voice: true }, 'Ada Lovelace')
        .statement
    ).toBe(CONSENT_STATEMENT);
  });
  test('registry writes the shared VoiceModel shape and revokes', async () => {
    const reg = new VoiceRegistry(dir);
    const voice: VoiceModel = {
      id: VoiceRegistry.newId(),
      performer: 'Ada',
      status: 'training',
      created_at: 't',
      provider: 'replicate',
      model_url: null,
      consent: {
        own_voice: true,
        attested_name: 'Ada',
        statement: CONSENT_STATEMENT,
        attested_at: 't',
        session_id: 's'
      }
    };
    await reg.write({ ...voice, status: 'ready', model_file: voice.id + '.model.zip' });
    await writeFile(join(dir, 'shared', 'voices', voice.id + '.model.zip'), 'zip');
    await expect(reg.write({ ...voice, model_file: '../evil.model.zip' })).rejects.toThrow();
    const raw: unknown = JSON.parse(
      await readFile(join(dir, 'shared', 'voices', voice.id + '.json'), 'utf8')
    );
    expect(isVoiceModel(raw)).toBe(true);
    expect((await reg.list()).length).toBe(1);
    await reg.remove(voice.id);
    expect(await reg.list()).toEqual([]);
    await expect(stat(join(dir, 'shared', 'voices', voice.id + '.model.zip'))).rejects.toThrow();
    expect(() => reg.path('../x')).toThrow();
  });
  test('zip is a valid stored archive', () => {
    const z = buildZip([{ name: 'dataset/vocal/001.wav', data: new Uint8Array([1, 2, 3]) }]);
    expect(new DataView(z.buffer).getUint32(0, true)).toBe(0x04034b50);
    expect(new DataView(z.buffer).getUint32(z.length - 22, true)).toBe(0x06054b50);
  });
});

describe('gate + replicate (mocked)', () => {
  test('gate: 403 outside dev, 415 for simple requests', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(guardMutation(new Request('http://x', { method: 'POST' }), { json: true })?.status).toBe(
      403
    );
    process.env.NODE_ENV = 'development';
    expect(
      guardMutation(
        new Request('http://x', {
          method: 'POST',
          headers: { host: 'localhost:5413', 'content-type': 'text/plain' }
        }),
        { json: true }
      )?.status
    ).toBe(415);
    expect(
      guardMutation(
        new Request('http://x', {
          method: 'POST',
          headers: { host: 'localhost:5413', 'content-type': 'application/json' }
        }),
        { json: true }
      )
    ).toBeNull();
    process.env.NODE_ENV = env;
  });
  test('client polls to success and rejects foreign hosts', async () => {
    const calls: string[] = [];
    const responses = [
      Response.json({ id: 'abc', status: 'processing' }),
      Response.json({ id: 'abc', status: 'succeeded', output: 'https://replicate.delivery/x.wav' })
    ];
    const fake = (async (url: string | URL | Request) => {
      calls.push(String(url));
      return responses.shift() ?? new Response('', { status: 500 });
    }) as typeof fetch;
    const c = new ReplicateClient('t', fake);
    const p = await c.wait(await c.create('v', {}), { intervalMs: 1 });
    expect(p.status).toBe('succeeded');
    expect(calls[1]).toContain('/predictions/abc');
    expect(isAllowedOutputUrl('https://evil.example/x')).toBe(false);
    await expect(c.download('https://evil.example/x', 10)).rejects.toThrow(
      'Unexpected output host'
    );
  });
});

describe('replicate regressions (live e2e)', () => {
  test('accepts inline data: audio output (Demucs isolate_stem)', async () => {
    const wav = new Uint8Array(128);
    wav.set([82, 73, 70, 70]);
    const c = new ReplicateClient(
      't',
      (async () => new Response('', { status: 500 })) as unknown as typeof fetch
    );
    const out = await c.download(
      'data:audio/x-wav;base64,' + Buffer.from(wav).toString('base64'),
      1024
    );
    expect(out.byteLength).toBe(128);
    await expect(c.download('data:text/html;base64,AAAA', 1024)).rejects.toThrow(
      'Unexpected inline'
    );
  });
  test('retries a 429 throttle then succeeds', async () => {
    const queue = [
      Response.json({ detail: 'throttled', retry_after: 1 }, { status: 429 }),
      Response.json({ id: 'ok1', status: 'starting' })
    ];
    const c = new ReplicateClient(
      't',
      (async () => queue.shift()!) as unknown as typeof fetch,
      0.001
    );
    expect((await c.create('v', {})).id).toBe('ok1');
  });
});

describe('voice profile pitch', () => {
  const tone = (hz: number, rate: number, n: number, harmonics = [1, 0.6, 0.4]) =>
    Float32Array.from(
      { length: n },
      (_, i) =>
        harmonics.reduce(
          (t, a, k) => t + a * Math.sin((2 * Math.PI * hz * (k + 1) * i) / rate),
          0
        ) * 0.2
    );
  test('no octave-down error on harmonic-rich tones', () => {
    for (const hz of [110, 220, 330, 440]) {
      const got = framePitch(tone(hz, 16000, 1024), 16000);
      expect(got).not.toBeNull();
      expect(Math.abs((got as number) / hz - 1)).toBeLessThan(0.03);
    }
  });
  test('profile range of a 220-440 Hz sweep stays in range', () => {
    const rate = 16000;
    const parts = [220, 262, 330, 392, 440].map((hz) => tone(hz, rate, rate));
    const pcm = new Float32Array(parts.reduce((t, p) => t + p.length, 0));
    let o = 0;
    for (const p of parts) {
      pcm.set(p, o);
      o += p.length;
    }
    const prof = analyzeProfile(pcm, rate);
    expect(prof.pitch_low_hz as number).toBeGreaterThan(200);
    expect(prof.pitch_high_hz as number).toBeLessThan(470);
    expect(describeProfile(prof).range).toContain('A3');
  });
});

test('profile drops sub-harmonic outliers far below the median', () => {
  const rate = 16000;
  const sine = (hz: number, n: number) =>
    Float32Array.from({ length: n }, (_, i) => 0.3 * Math.sin((2 * Math.PI * hz * i) / rate));
  const parts = [sine(330, rate * 4), sine(80, rate / 2)];
  const pcm = new Float32Array(parts[0].length + parts[1].length);
  pcm.set(parts[0]);
  pcm.set(parts[1], parts[0].length);
  expect(analyzeProfile(pcm, rate).pitch_low_hz as number).toBeGreaterThan(300);
});

describe('recorder formats (webm/opus, ogg, m4a)', () => {
  const encoders = async () => {
    const p = Bun.spawn([FFMPEG, '-hide_banner', '-encoders'], {
      stdout: 'pipe',
      stderr: 'ignore'
    });
    return new Response(p.stdout).text();
  };
  const cases: [string, string[], string][] = [
    ['rec.webm', ['-c:a', 'libopus', '-f', 'webm'], 'libopus'],
    ['rec.ogg', ['-c:a', 'libopus'], 'libopus'],
    ['rec.m4a', ['-c:a', 'aac'], ' aac ']
  ];
  for (const [name, codec, need] of cases)
    test(
      name + ' passes intake and repairs through the WAV transcode',
      async () => {
        if (!(await encoders()).includes(need))
          return console.warn('skip ' + name + ': no encoder');
        const src = join(dir, name);
        await ffmpeg(['-f', 'lavfi', '-i', 'sine=f=300:d=2,volume=0.3', ...codec, src]);
        const svcDir = await mkdtemp(join(tmpdir(), 'vbm-vf-test-svc-'));
        try {
          const { VocalFixService } = await import('./service');
          const s = new VocalFixService(
            svcDir,
            () => null,
            fetch,
            () => new Date(0),
            10
          );
          const m = await s.intake({
            mode: 'fix',
            performer: 'Test Voice',
            acknowledged_rights: true,
            files: [{ name, bytes: new Uint8Array(await readFile(src)) }]
          });
          expect(m.recordings[0].integrity_verified).toBe(true);
          expect(m.recordings[0].probe.duration_seconds).toBeGreaterThan(1.5);
          const job = await s.startRepair(m.id, { preset: 'natural' });
          await s.jobs.idle(m.id, 30_000);
          const done = await s.jobs.get(s.store.sessionDir(m.id), job.id);
          expect(done.status).toBe('completed');
          const after = await s.store.read(m.id);
          expect(after.versions[0].file).toBe('take-1.repair.v1.wav');
          expect(after.versions[0].provenance[0].step).toBe('transcode');
        } finally {
          await rm(svcDir, { recursive: true, force: true });
        }
      },
      60_000
    );
});

describe('range responses', () => {
  test('206, 416 and full', async () => {
    const { fileResponse, parseRange } = await import('./range');
    const f = join(dir, 'range.bin');
    await writeFile(
      f,
      new Uint8Array(100).map((_, i) => i)
    );
    const part = fileResponse(f, 100, 'audio/wav', 'bytes=10-19');
    expect(part.status).toBe(206);
    expect(part.headers.get('content-range')).toBe('bytes 10-19/100');
    expect(part.headers.get('accept-ranges')).toBe('bytes');
    expect([...new Uint8Array(await part.arrayBuffer())][0]).toBe(10);
    expect(fileResponse(f, 100, 'audio/wav', 'bytes=200-').status).toBe(416);
    expect(fileResponse(f, 100, 'audio/wav', null).status).toBe(200);
    expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
  });
});

test('readCapped stops a chunked body past the cap', async () => {
  const { readCapped } = await import('./gate');
  const stream = new ReadableStream<Uint8Array>({
    pull(c) {
      c.enqueue(new Uint8Array(1024));
    }
  });
  const req = new Request('http://x', {
    method: 'POST',
    body: stream,
    duplex: 'half'
  } as RequestInit);
  expect(await readCapped(req, 10_000)).toBeNull();
  expect(
    (await readCapped(new Request('http://x', { method: 'POST', body: 'abc' }), 10))?.byteLength
  ).toBe(3);
});

describe('DNS-rebinding host guard', () => {
  test('only loopback hosts pass', async () => {
    const { isLocalHost, guardMutation } = await import('./gate');
    for (const h of ['localhost:5413', '127.0.0.1:5413', '[::1]:5413', 'LOCALHOST', '127.0.0.1'])
      expect(isLocalHost(h)).toBe(true);
    for (const h of [
      'evil.example',
      'localhost.evil.example:5413',
      '127.0.0.1.nip.io',
      '10.0.0.2:5413',
      null
    ])
      expect(isLocalHost(h)).toBe(false);
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const req = (host: string) =>
      new Request('http://x/api', {
        method: 'POST',
        headers: { host, 'content-type': 'application/json' }
      });
    expect(guardMutation(req('evil.example:5413'), { json: true })?.status).toBe(403);
    expect(guardMutation(req('127.0.0.1:5413'), { json: true })).toBeNull();
    process.env.NODE_ENV = env;
  });
  test('hook blocks a rebinding host on any /api route', async () => {
    const { handle } = await import('../../hooks.server');
    const call = (host: string, path: string) =>
      handle({
        event: {
          url: new URL('http://' + host + path),
          request: new Request('http://' + host + path, { headers: { host } })
        },
        resolve: async () => new Response('ok')
      } as unknown as Parameters<typeof handle>[0]);
    expect((await call('evil.example', '/api/capabilities')).status).toBe(403);
    expect((await call('localhost:5413', '/api/capabilities')).status).toBe(200);
  });
});

describe('job runner: limits and restart', () => {
  const mkRunner = async (limits = { maxRunning: 2, maxForge: 1 }) => {
    const { JobRunner } = await import('./jobs');
    return new JobRunner(
      await mkdtemp(join(tmpdir(), 'vbm-vf-test-jobs-')),
      () => new Date(0),
      limits
    );
  };
  test('at most 2 running, at most 1 forge; rest queued', async () => {
    const r = await mkRunner();
    const gates: (() => void)[] = [];
    const work = () => new Promise<Record<string, unknown>>((res) => gates.push(() => res({})));
    const a = await r.start('', 's', 'forge', [], work);
    const b = await r.start('', 's', 'forge', [], work);
    const c = await r.start('', 's', 'repair', [], work);
    const d = await r.start('', 's', 'repair', [], work);
    const st = async () =>
      Promise.all([a, b, c, d].map(async (j) => (await r.get('', j.id)).status));
    // Poll for the expected state instead of sleeping a fixed time: slow CI runners
    // can take longer than a few milliseconds to start the next queued job.
    const until = async (ok: (s: string[]) => boolean) => {
      for (let i = 0; i < 200 && !ok(await st()); i++) await Bun.sleep(10);
      return st();
    };
    expect(await until((s) => s[0] === 'running' && s[2] === 'running')).toEqual([
      'running',
      'queued',
      'running',
      'queued'
    ]);
    gates.shift()?.();
    const after = await until(
      (s) => s[0] === 'completed' && s.filter((x) => x === 'running').length === 2
    );
    expect(after[0]).toBe('completed');
    expect(after.filter((x) => x === 'running').length).toBe(2);
    while (gates.length) gates.shift()?.();
    await Bun.sleep(30);
    while (gates.length) gates.shift()?.();
    await r.idle('s', 2000);
    expect(new Set(await st())).toEqual(new Set(['completed']));
    await rm(r.dir, { recursive: true, force: true });
  });
  test('jobs left running are failed on restart', async () => {
    const r = await mkRunner();
    const j = await r.start(
      '',
      's',
      'repair',
      [{ id: 'x', label: 'X' }],
      () => new Promise(() => undefined)
    );
    await Bun.sleep(20);
    const { JobRunner, RESTART_ERROR } = await import('./jobs');
    const fresh = new JobRunner(r.dir, () => new Date(0));
    expect(await fresh.recover()).toBe(1);
    const after = await fresh.get('', j.id);
    expect(after.status).toBe('failed');
    expect(after.error).toBe(RESTART_ERROR);
    await rm(r.dir, { recursive: true, force: true });
  });
});

describe('adaptive local chain + never-worse guard', () => {
  test('noise floor drives denoise, gate and strength', () => {
    const quiet = buildPolishChain('natural', { clipped_samples: 0, noise_floor_db: -70 });
    expect(quiet).not.toContain('agate');
    expect(quiet).toContain('afftdn=nr=8:nf=-70');
    const noisy = buildPolishChain('natural', { clipped_samples: 0, noise_floor_db: -23 });
    expect(noisy).toContain('afftdn=nr=20:nf=-23:tn=1');
    expect(noisy).toMatch(/agate=threshold=0\.1\d+:ratio=8:range=0\.1/);
    const strong = buildPolishChain('natural', { clipped_samples: 0, noise_floor_db: -23 }, 1);
    expect(strong).toContain('afftdn=nr=26');
    expect(strong).toContain('range=0.05');
  });
  test('make-up gain is capped', () => {
    expect(loudnessGainDb(-40, 'natural')).toBe(MAX_MAKEUP_DB);
    expect(loudnessGainDb(-40, 'natural', 1)).toBe(6);
    expect(loudnessGainDb(-10, 'natural')).toBe(-8);
    expect(loudnessGainDb(null, 'natural')).toBe(0);
  });
  test('regressions flag drops over 5 points only', () => {
    const before = { noise: 0.07, clipping: 0, overall: 0.28 };
    expect(regressions(before, { noise: 0, clipping: 1, overall: 0.69 })).toEqual(['noise']);
    expect(regressions(before, { noise: 0.03, clipping: 1, overall: 0.69 })).toEqual([]);
    expect(regressions(undefined, { noise: 0, clipping: 0, overall: 0 })).toEqual([]);
    expect(regressionFinding('noise')).toContain('try AI enhance');
  });
});

describe('job runner: failure reporting', () => {
  // Regression: failures were never logged, and raw internal messages reached the user.
  test('logs every failure; users see VocalFixError text or a generic message', async () => {
    const { JobRunner } = await import('./jobs');
    const dir = await mkdtemp(join(tmpdir(), 'vbm-vf-test-jobfail-'));
    const r = new JobRunner(dir, () => new Date(0));
    const logged: unknown[][] = [];
    const realError = console.error;
    console.error = (...args: unknown[]) => void logged.push(args);
    try {
      const internal = await r.start('', 's', 'repair', [], async () => {
        throw new Error("ENOENT: no such file or directory, open '/srv/vbm/data/secret.wav'");
      });
      const known = await r.start('', 's', 'repair', [], async () => {
        throw new VocalFixError('Audio failed to decode.', 422);
      });
      await r.idle('s', 2000);
      expect((await r.get('', internal.id)).error).toBe('Processing failed.');
      expect((await r.get('', known.id)).error).toBe('Audio failed to decode.');
      const lines = logged.map((a) => a.map(String).join(' '));
      expect(lines.some((l) => l.includes(internal.id) && l.includes('ENOENT'))).toBe(true);
      expect(lines.some((l) => l.includes(known.id) && l.includes('Audio failed'))).toBe(true);
    } finally {
      console.error = realError;
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('owner mode behind the edge Worker', () => {
  const SECRET = 'v'.repeat(48);
  const keys = ['NODE_ENV', 'VBM_OWNER_MODE', 'VBM_EDGE_SECRET'] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const restore = () => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  };
  const prod = (owner: boolean, secret = SECRET) => {
    process.env.NODE_ENV = 'production';
    if (owner) process.env.VBM_OWNER_MODE = '1';
    else delete process.env.VBM_OWNER_MODE;
    process.env.VBM_EDGE_SECRET = secret;
  };
  const call = async (path: string, headers: Record<string, string>) => {
    const { handle } = await import('../../hooks.server');
    return handle({
      event: {
        url: new URL('http://localhost:3001' + path),
        request: new Request('http://localhost:3001' + path, { headers })
      },
      resolve: async () => new Response('ok')
    } as unknown as Parameters<typeof handle>[0]);
  };

  test('production without owner mode stays closed', async () => {
    const { processingAllowed, isOwnerEdgeRequest } = await import('./gate');
    prod(false);
    expect(processingAllowed()).toBe(false);
    expect(
      isOwnerEdgeRequest(new Request('http://x', { headers: { 'x-vbm-edge-auth': SECRET } }))
    ).toBe(false);
    restore();
  });

  test('owner mode needs a long secret, and every API call must carry it', async () => {
    const { processingAllowed } = await import('./gate');
    prod(true, 'short');
    expect(processingAllowed()).toBe(false);
    prod(true);
    expect(processingAllowed()).toBe(true);
    expect((await call('/api/capabilities', { host: 'localhost:3001' })).status).toBe(403);
    expect(
      (await call('/api/capabilities', { host: 'localhost:3001', 'x-vbm-edge-auth': 'wrong' }))
        .status
    ).toBe(403);
    const ok = await call('/api/capabilities', {
      host: 'vbm-studio.example.workers.dev',
      'x-vbm-edge-auth': SECRET
    });
    expect(ok.status).toBe(200);
    expect((await call('/', { host: 'localhost:3001' })).status).toBe(200);
    restore();
  });

  test('base path helpers', async () => {
    const { normaliseBase, stripBase } = await import('../base');
    expect(normaliseBase(undefined)).toBe('');
    expect(normaliseBase('/vocal-fix/')).toBe('/vocal-fix');
    expect(() => normaliseBase('vocal-fix')).toThrow();
    expect(() => normaliseBase('/a/../b')).toThrow();
    expect(normaliseBase('/apps/vocal-fix')).toBe('/apps/vocal-fix');
    expect(stripBase('/vocal-fix/api/voices', '/vocal-fix')).toBe('/api/voices');
    expect(stripBase('/vocal-fix', '/vocal-fix')).toBe('/');
    expect(stripBase('/vocal-fixer/api', '/vocal-fix')).toBe('/vocal-fixer/api');
    expect(stripBase('/api/x', '')).toBe('/api/x');
  });
});
