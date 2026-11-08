import { afterAll, beforeAll, describe, expect, mock, setDefaultTimeout, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { zipSync } from 'fflate';

mock.module('$app/env/private', () => ({
  ANTHROPIC_API_KEY: undefined,
  ELEVENLABS_API_KEY: undefined,
  FAL_KEY: undefined,
  GEMINI_API_KEY: undefined,
  MINIMAX_API_KEY: undefined,
  OPENAI_API_KEY: undefined,
  REPLICATE_API_TOKEN: undefined,
  VBM_ENGINE_TOKEN: undefined,
  VBM_ENGINE_URL: undefined
}));

const { SongLibrary, LibraryError } = await import('./library');
const { instrumentalSources } = await import('./voicesummon');
const up = await import('./uploads');
const { ffmpegPath } = await import('./master');

// Real ffmpeg runs make these slower than the 5 s default.
setDefaultTimeout(60_000);

let work: string;
const fx: Record<string, Uint8Array> = {};
const now = new Date('2026-11-07T12:00:00Z');
const rights = { statement: up.rightsStatement, attested_at: now.toISOString() };

async function ff(args: string[], out: string): Promise<Uint8Array> {
  const file = path.join(work, out);
  const proc = Bun.spawn([ffmpegPath, '-v', 'error', '-y', ...args, file], {
    stdout: 'ignore',
    stderr: 'pipe'
  });
  const err = await new Response(proc.stderr).text();
  if ((await proc.exited) !== 0) throw new Error('fixture ' + out + ': ' + err);
  return new Uint8Array(await readFile(file));
}

const sine = (freq = 440, seconds = 1) => [
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=' + freq + ':duration=' + seconds
];

beforeAll(async () => {
  work = await mkdtemp(path.join(tmpdir(), 'vbm-upload-'));
  fx.wav = await ff(sine(), 'a.wav');
  fx.mp3 = await ff(sine(), 'a.mp3');
  fx.flac = await ff(sine(), 'a.flac');
  fx.opus = await ff([...sine(), '-c:a', 'libopus'], 'a.ogg');
  fx.m4a = await ff([...sine(), '-c:a', 'aac'], 'a.m4a');
  fx.aiff = await ff(sine(), 'a.aiff');
  fx.webm = await ff([...sine(), '-c:a', 'libopus'], 'a.webm');
  const video = ['-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1', '-c:v', 'mpeg4'];
  fx.mp4 = await ff([...video, ...sine(), '-c:a', 'aac', '-shortest'], 'v.mp4');
  fx.mute = await ff(video, 'mute.mp4');
});

afterAll(async () => {
  await rm(work, { recursive: true, force: true });
});

async function library() {
  return new SongLibrary(await mkdtemp(path.join(work, 'lib-')));
}

const input = (files: { name: string; bytes: Uint8Array }[], type = 'song' as const) => ({
  type,
  title: 'My upload',
  tags: ['lofi'],
  rights,
  files
});

async function rejects(p: Promise<unknown>, status: number) {
  const error = await p.then(
    () => null,
    (e: unknown) => e
  );
  expect(error).toBeInstanceOf(LibraryError);
  expect((error as InstanceType<typeof LibraryError>).status).toBe(status);
}

describe('format sniffing', () => {
  test('recognises real containers', () => {
    expect(up.sniffFormat(fx.wav)).toBe('wav');
    expect(up.sniffFormat(fx.mp3)).toBe('mp3');
    expect(up.sniffFormat(fx.flac)).toBe('flac');
    expect(up.sniffFormat(fx.opus)).toBe('ogg');
    expect(up.sniffFormat(fx.m4a)).toBe('mp4');
    expect(up.sniffFormat(fx.aiff)).toBe('aiff');
    expect(up.sniffFormat(fx.webm)).toBe('webm');
    expect(up.sniffFormat(fx.mp4)).toBe('mp4');
    expect(up.sniffFormat(new TextEncoder().encode('hello world, not audio'))).toBeNull();
  });

  test('rejects wrong extension, wrong content, unknown extension and oversize', () => {
    const status = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return (e as InstanceType<typeof LibraryError>).status;
      }
      return 0;
    };
    expect(status(() => up.checkAudioFile('song.mp3', fx.wav))).toBe(415);
    expect(
      status(() => up.checkAudioFile('song.wav', new TextEncoder().encode('x'.repeat(64))))
    ).toBe(415);
    expect(status(() => up.checkAudioFile('song.exe', fx.wav))).toBe(415);
    expect(status(() => up.checkAudioFile('song.wav', new Uint8Array(0)))).toBe(422);
    const huge = { length: up.uploadLimits.fileBytes + 1 } as unknown as Uint8Array;
    expect(status(() => up.checkAudioFile('song.wav', huge))).toBe(413);
    expect(up.checkAudioFile('recording', fx.webm)).toBe('webm');
    expect(up.checkAudioFile('take.m4a', fx.m4a)).toBe('mp4');
  });
});

describe('importSong', () => {
  test('keeps the original untouched, makes a FLAC copy and lists it in the library', async () => {
    const lib = await library();
    const song = await up.importSong(
      lib,
      input([{ name: '../../etc/passwd.mp3', bytes: fx.mp3 }]),
      now
    );
    expect(song.kind).toBe('upload');
    expect(song.audio?.content_type).toBe('audio/flac');
    expect(song.upload?.rights.attested_at).toBe(now.toISOString());
    const original = song.upload!.originals[0];
    expect(original.file).toBe('originals/01.mp3');
    const stored = new Uint8Array(await readFile(await lib.assetFile(song.id, original.file)));
    expect(Buffer.from(stored).equals(Buffer.from(fx.mp3))).toBe(true);
    const main = await lib.audioFile(song.id, 'main');
    expect((await up.probeMedia(main.file)).duration).toBeGreaterThan(0.9);
    expect((await lib.list()).map((s) => s.id)).toEqual([song.id]);
  });

  test.each(['wav', 'flac', 'opus', 'm4a', 'aiff', 'webm'])('decodes %s', async (kind) => {
    const name = { opus: 'a.opus', m4a: 'a.m4a', webm: 'rec.webm' }[kind] ?? 'a.' + kind;
    const song = await up.importSong(await library(), input([{ name, bytes: fx[kind] }]), now);
    expect(song.audio?.bytes).toBeGreaterThan(0);
  });

  test('extracts the audio track of a video and rejects a silent video', async () => {
    const lib = await library();
    const song = await up.importSong(
      lib,
      input([{ name: 'clip.mp4', bytes: fx.mp4 }], 'video' as never),
      now
    );
    expect(song.upload?.had_video).toBe(true);
    expect(song.upload?.originals[0].file).toBe('originals/01.mp4');
    await rejects(
      up.importSong(lib, input([{ name: 'mute.mp4', bytes: fx.mute }], 'video' as never), now),
      422
    );
    expect(await lib.list()).toHaveLength(1);
  });

  test('a damaged file is refused and leaves nothing behind', async () => {
    const lib = await library();
    const broken = new Uint8Array(fx.flac.slice(0, 60));
    await rejects(up.importSong(lib, input([{ name: 'x.flac', bytes: broken }]), now), 422);
    expect(await lib.list()).toEqual([]);
  });

  test('stems: buses for the mixer, a mixdown, and voice summon can use them', async () => {
    const lib = await library();
    const zip = zipSync({
      'band/Lead Vocal.wav': fx.wav,
      'band/Kick.wav': fx.wav,
      'band/Snare.mp3': fx.mp3,
      'band/Synth.flac': fx.flac,
      '__MACOSX/band/._Kick.wav': new Uint8Array([1, 2, 3]),
      'band/.DS_Store': new Uint8Array([0]),
      'band/notes.txt': new TextEncoder().encode('hi')
    });
    const files = up.unzipStems(zip);
    expect(files.map((f) => f.name)).toEqual([
      'Kick.wav',
      'Lead Vocal.wav',
      'Snare.mp3',
      'Synth.flac'
    ]);
    const song = await up.importSong(lib, input(files, 'stems' as never), now);
    expect(song.stems?.map((s) => s.name)).toEqual(['vocals', 'drums', 'other']);
    expect(song.upload?.originals.map((o) => o.stem)).toEqual([
      'drums',
      'vocals',
      'drums',
      'other'
    ]);
    for (const stem of song.stems!)
      expect((await lib.audioFile(song.id, stem.name)).size).toBeGreaterThan(0);
    const sources = await instrumentalSources(lib, song.id);
    expect(sources.files).toHaveLength(2);
    await rejects(up.importSong(lib, input([files[0]], 'stems' as never), now), 422);
  });

  test('ZIP guards: traversal, too many entries', () => {
    const status = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return (e as InstanceType<typeof LibraryError>).status;
      }
      return 0;
    };
    expect(status(() => up.unzipStems(zipSync({ '../evil.wav': fx.wav })))).toBe(422);
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < 17; i++) many['s' + i + '.wav'] = fx.wav;
    expect(status(() => up.unzipStems(zipSync(many)))).toBe(422);
    expect(status(() => up.unzipStems(new TextEncoder().encode('not a zip')))).toBe(422);
    expect(status(() => up.unzipStems(zipSync({ 'a.txt': fx.wav })))).toBe(422);
  });
});

function midi(
  header: { length?: number; format?: number; tracks?: number; division?: number } = {}
) {
  const b = new Uint8Array(26);
  const v = new DataView(b.buffer);
  b.set(new TextEncoder().encode('MThd'), 0);
  v.setUint32(4, header.length ?? 6);
  v.setUint16(8, header.format ?? 0);
  v.setUint16(10, header.tracks ?? 1);
  v.setUint16(12, header.division ?? 480);
  b.set(new TextEncoder().encode('MTrk'), 14);
  v.setUint32(18, 4);
  b.set([0x00, 0xff, 0x2f, 0x00], 22);
  return b;
}

describe('MIDI', () => {
  test('header validation', () => {
    expect(() => up.validateMidi(midi())).not.toThrow();
    for (const bad of [
      midi({ length: 7 }),
      midi({ format: 3 }),
      midi({ tracks: 0 }),
      midi({ division: 0 })
    ])
      expect(() => up.validateMidi(bad)).toThrow(LibraryError);
    expect(() => up.validateMidi(fx.wav.slice(0, 40))).toThrow(LibraryError);
  });

  test('stores the rendered preview and the original .mid', async () => {
    const lib = await library();
    const song = await up.importSong(
      lib,
      { ...input([{ name: 'beat.wav', bytes: fx.wav }], 'midi' as never), midi: midi() },
      now
    );
    expect(song.upload?.midi?.file).toBe('originals/source.mid');
    expect((await readFile(await lib.assetFile(song.id, 'originals/source.mid'))).length).toBe(26);
    await rejects(
      up.importSong(lib, input([{ name: 'beat.wav', bytes: fx.wav }], 'midi' as never), now),
      422
    );
  });
});

function tinyPdf(lines: string[]): Uint8Array {
  const content =
    'BT /F1 12 Tf 72 720 Td 14 TL ' + lines.map((l) => '(' + l + ") '").join(' ') + ' ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += i + 1 + ' 0 obj\n' + o + '\nendobj\n';
  });
  const xref = out.length;
  out += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (const o of offsets) out += String(o).padStart(10, '0') + ' 00000 n \n';
  out +=
    'trailer\n<< /Size ' +
    (objects.length + 1) +
    ' /Root 1 0 R >>\nstartxref\n' +
    xref +
    '\n%%EOF\n';
  return new TextEncoder().encode(out);
}

describe('lyrics extraction', () => {
  const enc = (s: string) => new TextEncoder().encode(s);

  test('txt and md normalise blank lines', async () => {
    const { text } = await up.extractLyrics(
      'a.txt',
      enc('\uFEFFLine one  \r\n\r\n\r\n\r\nLine two\n')
    );
    expect(text).toBe('Line one\n\nLine two');
  });

  test('lrc drops timestamps and tags', async () => {
    const lrc = '[ar:Me]\n[ti:Song]\n[00:01.00]Hello there\n[00:03.50][01:03.50]Chorus line\n';
    expect((await up.extractLyrics('a.lrc', enc(lrc))).text).toBe('Hello there\nChorus line');
  });

  test('srt drops cue numbers and timings', async () => {
    const srt =
      '1\n00:00:01,000 --> 00:00:02,000\nFirst line\n\n2\n00:00:02,500 --> 00:00:04,000\n<i>Second</i> line\n';
    expect((await up.extractLyrics('a.srt', enc(srt))).text).toBe('First line\nSecond line');
  });

  test('vtt drops header, notes and timings', async () => {
    const vtt =
      'WEBVTT\n\nNOTE a comment\n\nintro\n00:01.000 --> 00:02.000 align:start\nFirst &amp; best\n\n00:02.000 --> 00:03.000\n<v Singer>Second</v>\n';
    expect((await up.extractLyrics('a.vtt', enc(vtt))).text).toBe('First & best\nSecond');
  });

  test('docx reads paragraphs', async () => {
    const xml =
      '<?xml version="1.0"?><w:document xmlns:w="x"><w:body>' +
      '<w:p><w:r><w:t>[Verse]</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t xml:space="preserve">Walking </w:t></w:r><w:r><w:t>home &amp; dry</w:t></w:r></w:p>' +
      '<w:p></w:p><w:p><w:r><w:t>Line</w:t><w:br/><w:t>break</w:t></w:r></w:p>' +
      '</w:body></w:document>';
    const docx = zipSync({ 'word/document.xml': enc(xml), '[Content_Types].xml': enc('<Types/>') });
    expect((await up.extractLyrics('a.docx', docx)).text).toBe(
      '[Verse]\nWalking home & dry\n\nLine\nbreak'
    );
  });

  test('pdf reads the text layer', async () => {
    const { text } = await up.extractLyrics('a.pdf', tinyPdf(['Hello from a PDF', 'Second line']));
    expect(text).toContain('Hello from a PDF');
    expect(text).toContain('Second line');
  });

  test('wrong content and unsupported types are refused', async () => {
    await rejects(up.extractLyrics('a.pdf', enc('not a pdf')), 415);
    await rejects(up.extractLyrics('a.docx', enc('nope')), 415);
    await rejects(up.extractLyrics('a.txt', fx.wav), 415);
    await rejects(up.extractLyrics('a.rtf', enc('x')), 415);
    await rejects(up.extractLyrics('a.txt', enc('\n\n  \n')), 422);
    await rejects(up.extractLyrics('a.txt', enc('x'.repeat(15001))), 422);
  });

  test('lyric sheets store, list, get and delete', async () => {
    const sheets = new up.LyricSheets(await mkdtemp(path.join(work, 'ly-')));
    const sheet = await sheets.add({
      title: 'T',
      text: 'words',
      source: 'paste',
      created_at: now.toISOString(),
      rights
    });
    expect((await sheets.list()).map((s) => s.id)).toEqual([sheet.id]);
    expect((await sheets.get(sheet.id)).text).toBe('words');
    await sheets.remove(sheet.id);
    await rejects(sheets.get(sheet.id), 404);
    await rejects(sheets.get('../../etc'), 404);
  });
});

describe('upload routes', () => {
  const realEnv = process.env.NODE_ENV;
  const realData = process.env.VBM_DATA_DIR;
  afterAll(() => {
    process.env.NODE_ENV = realEnv;
    if (realData === undefined) delete process.env.VBM_DATA_DIR;
    else process.env.VBM_DATA_DIR = realData;
  });

  const noNet = (async () =>
    new Response('no network', { status: 599 })) as unknown as typeof fetch;

  function form(fields: Record<string, string>, file?: { name: string; bytes: Uint8Array }) {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    if (file) f.append('file', new File([file.bytes], file.name));
    return f;
  }

  async function post(
    body: FormData,
    headers: Record<string, string> = { 'x-vbm-intent': 'upload' },
    host = 'localhost:5174'
  ) {
    const { POST } = await import('../../../routes/api/studio/uploads/+server');
    const url = new URL('http://' + host + '/api/studio/uploads');
    const request = new Request(url, { method: 'POST', headers: { host, ...headers }, body });
    return (POST as unknown as (e: unknown) => Promise<Response>)({
      request,
      url,
      params: {},
      fetch: noNet
    });
  }

  test('guard: non-dev 403, foreign host 403, missing intent 415, rights required, then success', async () => {
    process.env.VBM_DATA_DIR = await mkdtemp(path.join(work, 'data-'));
    const fields = { type: 'beat', title: 'Beat one', genre: 'trap', rights: 'true' };
    const file = { name: 'beat.wav', bytes: fx.wav };
    process.env.NODE_ENV = 'production';
    expect((await post(form(fields, file))).status).toBe(403);
    process.env.NODE_ENV = 'development';
    expect((await post(form(fields, file), undefined, 'evil.example')).status).toBe(403);
    expect((await post(form(fields, file), {})).status).toBe(415);
    const noRights = await post(form({ ...fields, rights: '' }, file));
    expect(noRights.status).toBe(422);
    expect((await noRights.json()).detail).toContain('rights');
    const ok = await post(form(fields, file));
    expect(ok.status).toBe(201);
    const { song } = await ok.json();
    expect(song.upload.type).toBe('beat');
    expect(song.style_tags).toEqual(['trap']);
    const lib = new SongLibrary(process.env.VBM_DATA_DIR);
    expect((await lib.list()).map((s) => s.id)).toEqual([song.id]);
  });

  test('lyrics: pasted JSON and a file upload', async () => {
    process.env.VBM_DATA_DIR = await mkdtemp(path.join(work, 'data-'));
    process.env.NODE_ENV = 'development';
    const mod = await import('../../../routes/api/studio/uploads/lyrics/+server');
    const run = (request: Request) =>
      (mod.POST as unknown as (e: unknown) => Promise<Response>)({
        request,
        url: new URL(request.url),
        params: {},
        fetch: noNet
      });
    const json = (body: unknown) =>
      new Request('http://localhost/api/studio/uploads/lyrics', {
        method: 'POST',
        headers: { host: 'localhost', 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
    expect((await run(json({ title: 'P', text: 'la words' }))).status).toBe(422);
    expect((await run(json({ title: 'P', text: 'some words', rights: true }))).status).toBe(201);
    const f = form(
      { title: 'Sub', rights: 'true' },
      { name: 'x.srt', bytes: new TextEncoder().encode('1\n00:00:01,000 --> 00:00:02,000\nHi\n') }
    );
    const res = await run(
      new Request('http://localhost/api/studio/uploads/lyrics', {
        method: 'POST',
        headers: { host: 'localhost', 'x-vbm-intent': 'upload' },
        body: f
      })
    );
    expect(res.status).toBe(201);
    expect((await res.json()).sheet.text).toBe('Hi');
    const list = await (mod.GET as unknown as (e: unknown) => Promise<Response>)({
      request: new Request('http://localhost/x', { headers: { host: 'localhost' } }),
      fetch: noNet
    });
    expect((await list.json()).sheets).toHaveLength(2);
  });
});
