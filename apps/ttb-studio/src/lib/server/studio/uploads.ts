import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { unzipSync } from 'fflate';
import type {
  LyricSheet,
  RightsAttestation,
  SongMeta,
  StemName,
  StoredAudio,
  UploadOriginal,
  UploadType
} from '@vbm/contracts';
import { uploadTypes } from '@vbm/contracts';
import { guard } from './context';
import { LibraryError, type SongLibrary } from './library';
import { ffmpegPath } from './master';

export const ffprobePath =
  process.env.FFPROBE_PATH?.trim() || Bun.which('ffprobe') || '/usr/local/bin/ffprobe';

export const uploadLimits = {
  fileBytes: 200 * 1024 * 1024,
  requestBytes: 400 * 1024 * 1024,
  maxSeconds: 15 * 60,
  maxStems: 16,
  zipUncompressedBytes: 400 * 1024 * 1024,
  midiBytes: 2 * 1024 * 1024,
  lyricsFileBytes: 5 * 1024 * 1024,
  lyricsChars: 15000
} as const;

export const rightsStatement = 'I made this or have the rights to use it.';

/** Upload writes are multipart, so they need the x-vbm-intent header (or JSON) instead of guard()'s JSON rule. */
export function uploadGuard(request: Request): Response | null {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  const type = (request.headers.get('content-type') ?? '').toLowerCase().split(';')[0].trim();
  if (type !== 'application/json' && !request.headers.get('x-vbm-intent'))
    return Response.json(
      { detail: 'Uploads need the x-vbm-intent header (or a JSON body).' },
      { status: 415 }
    );
  return null;
}

export function rightsFrom(value: unknown, now: Date): RightsAttestation {
  if (value !== true && value !== 'true' && value !== 'on' && value !== 'yes')
    throw new LibraryError(422, 'Confirm that you made this or have the rights to use it.');
  return { statement: rightsStatement, attested_at: now.toISOString() };
}

/* ---------------- format sniffing ---------------- */

export type SniffedFormat =
  'mp3' | 'aac' | 'wav' | 'flac' | 'ogg' | 'aiff' | 'webm' | 'mkv' | 'mp4' | 'mov' | 'asf' | 'amr';

const ascii = (b: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...b.subarray(start, Math.min(end, b.length)));

/** Real container format from magic bytes; null when it is not a supported audio/video file. */
export function sniffFormat(b: Uint8Array): SniffedFormat | null {
  if (b.length < 12) return null;
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WAVE') return 'wav';
  if (ascii(b, 0, 4) === 'fLaC') return 'flac';
  if (ascii(b, 0, 4) === 'OggS') return 'ogg';
  if (ascii(b, 0, 4) === 'FORM' && /^AIF[FC]$/.test(ascii(b, 8, 12))) return 'aiff';
  if (ascii(b, 0, 5) === '#!AMR') return 'amr';
  if (b[0] === 0x30 && b[1] === 0x26 && b[2] === 0xb2 && b[3] === 0x75) return 'asf';
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
    return ascii(b, 0, 64).includes('webm') ? 'webm' : 'mkv';
  const box = ascii(b, 4, 8);
  if (box === 'ftyp') return ascii(b, 8, 10) === 'qt' ? 'mov' : 'mp4';
  if (box === 'moov' || box === 'mdat' || box === 'wide' || box === 'free') return 'mov';
  if (ascii(b, 0, 3) === 'ID3') return 'mp3';
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return 'aac';
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return 'mp3';
  return null;
}

/** Which sniffed formats each accepted extension may contain. */
const extensionFormats: Record<string, SniffedFormat[]> = {
  mp3: ['mp3'],
  wav: ['wav'],
  wave: ['wav'],
  flac: ['flac'],
  m4a: ['mp4', 'mov'],
  aac: ['aac', 'mp4'],
  alac: ['mp4', 'mov'],
  ogg: ['ogg'],
  oga: ['ogg'],
  opus: ['ogg'],
  aif: ['aiff'],
  aiff: ['aiff'],
  aifc: ['aiff'],
  webm: ['webm', 'mkv'],
  weba: ['webm', 'mkv'],
  wma: ['asf'],
  amr: ['amr'],
  mp4: ['mp4', 'mov'],
  m4v: ['mp4', 'mov'],
  mov: ['mov', 'mp4'],
  mkv: ['mkv', 'webm']
};
export const audioExtensions = Object.keys(extensionFormats);

const mimeFor: Record<SniffedFormat, string> = {
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  wav: 'audio/wav',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  aiff: 'audio/aiff',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  asf: 'audio/x-ms-wma',
  amr: 'audio/amr'
};

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]{1,5})$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : '';
}

/** Checks extension and content agree; returns the sniffed format. */
export function checkAudioFile(name: string, bytes: Uint8Array): SniffedFormat {
  if (bytes.length === 0) throw new LibraryError(422, 'The file is empty.');
  if (bytes.length > uploadLimits.fileBytes)
    throw new LibraryError(413, 'Each file can be up to 200 MB.');
  const format = sniffFormat(bytes);
  if (!format) throw new LibraryError(415, 'This file is not a supported audio or video format.');
  const ext = extensionOf(name);
  // A browser recording may arrive without a name; then the content decides.
  if (ext && !extensionFormats[ext])
    throw new LibraryError(415, 'Files ending in .' + ext + ' are not supported.');
  if (ext && !extensionFormats[ext].includes(format))
    throw new LibraryError(415, 'The file content does not match its .' + ext + ' extension.');
  return format;
}

/* ---------------- ffmpeg ---------------- */

async function spawn(
  cmd: string[],
  timeoutMs: number
): Promise<{ code: number; out: string; err: string }> {
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe', stdin: 'ignore' });
  const timer = setTimeout(() => proc.kill(), timeoutMs);
  const [out, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text()
  ]);
  const code = await proc.exited;
  clearTimeout(timer);
  return { code, out, err };
}

export interface ProbeResult {
  duration: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

export async function probeMedia(file: string): Promise<ProbeResult> {
  const { code, out } = await spawn(
    [ffprobePath, '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file],
    30_000
  );
  if (code !== 0) throw new LibraryError(422, 'This file could not be read as audio.');
  let data: { format?: { duration?: string }; streams?: Record<string, unknown>[] };
  try {
    data = JSON.parse(out);
  } catch {
    throw new LibraryError(422, 'This file could not be read as audio.');
  }
  const streams = data.streams ?? [];
  const hasAudio = streams.some((s) => s.codec_type === 'audio');
  const hasVideo = streams.some(
    (s) =>
      s.codec_type === 'video' &&
      !((s.disposition as Record<string, number> | undefined)?.attached_pic === 1)
  );
  const duration = Number(data.format?.duration);
  return { duration: Number.isFinite(duration) ? duration : 0, hasAudio, hasVideo };
}

/** Fully decodes the first audio stream into 44.1 kHz 16-bit stereo FLAC (the playable copy). */
export async function decodeToFlac(input: string, output: string): Promise<void> {
  const { code, err } = await spawn(
    [
      ffmpegPath,
      '-hide_banner',
      '-nostdin',
      '-v',
      'error',
      '-y',
      '-i',
      input,
      '-map',
      '0:a:0',
      '-vn',
      '-ac',
      '2',
      '-ar',
      '44100',
      '-sample_fmt',
      's16',
      '-t',
      String(uploadLimits.maxSeconds),
      '-c:a',
      'flac',
      output
    ],
    600_000
  );
  if (code !== 0) {
    console.error('ffmpeg decode failed:', err.slice(-400));
    throw new LibraryError(422, 'The audio could not be decoded; the file may be damaged.');
  }
}

/** Mixes several files into one FLAC (no normalisation, limiter against clipping). */
export async function mixToFlac(inputs: string[], output: string): Promise<void> {
  if (inputs.length === 1) return decodeToFlac(inputs[0], output);
  const { code, err } = await spawn(
    [
      ffmpegPath,
      '-hide_banner',
      '-nostdin',
      '-v',
      'error',
      '-y',
      ...inputs.flatMap((f) => ['-i', f]),
      '-filter_complex',
      'amix=inputs=' + inputs.length + ':duration=longest:normalize=0,alimiter=limit=0.95',
      '-ac',
      '2',
      '-ar',
      '44100',
      '-sample_fmt',
      's16',
      '-c:a',
      'flac',
      output
    ],
    600_000
  );
  if (code !== 0) {
    console.error('ffmpeg mix failed:', err.slice(-400));
    throw new LibraryError(422, 'The stems could not be mixed.');
  }
}

/* ---------------- ZIP stems ---------------- */

export interface NamedBytes {
  name: string;
  bytes: Uint8Array;
}

/** Audio entries of a stems ZIP, with traversal, count and size guards. */
export function unzipStems(zip: Uint8Array): NamedBytes[] {
  let total = 0;
  let count = 0;
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(zip, {
      filter: (entry) => {
        const name = entry.name;
        if (name.endsWith('/')) return false;
        if (name.includes('\\') || name.startsWith('/') || name.split('/').includes('..'))
          throw new LibraryError(422, 'The ZIP contains an unsafe path.');
        const parts = name.split('/');
        if (parts[0] === '__MACOSX' || parts.some((p) => p.startsWith('.'))) return false;
        if (!extensionFormats[extensionOf(name)]) return false;
        count += 1;
        total += entry.originalSize;
        if (count > uploadLimits.maxStems)
          throw new LibraryError(422, 'A stems ZIP can hold up to 16 audio files.');
        if (
          entry.originalSize > uploadLimits.fileBytes ||
          total > uploadLimits.zipUncompressedBytes
        )
          throw new LibraryError(413, 'The ZIP is too large once unpacked.');
        return true;
      }
    });
  } catch (error) {
    if (error instanceof LibraryError) throw error;
    throw new LibraryError(422, 'The ZIP file could not be opened.');
  }
  const out = Object.keys(files)
    .sort()
    .map((name) => ({ name: name.split('/').pop()!, bytes: files[name] }));
  // fflate reports originalSize from the header; re-check the real sizes.
  if (out.reduce((n, f) => n + f.bytes.length, 0) > uploadLimits.zipUncompressedBytes)
    throw new LibraryError(413, 'The ZIP is too large once unpacked.');
  if (out.length === 0) throw new LibraryError(422, 'The ZIP has no audio files.');
  return out;
}

/** Puts a stem file on one of the mixer's four buses by its name. */
export function stemBus(name: string): StemName {
  const n = name.toLowerCase();
  if (/vox|vocal|voice|sing|lead|choir|acapella|a_cappella/.test(n)) return 'vocals';
  if (/drum|kick|snare|hat|perc|cymbal|tom|beat|808/.test(n)) return 'drums';
  if (/bass|sub/.test(n)) return 'bass';
  return 'other';
}

/* ---------------- MIDI ---------------- */

/** Standard MIDI file header check: MThd, length 6, format 0-2, tracks, division and an MTrk chunk. */
export function validateMidi(b: Uint8Array): void {
  if (b.length > uploadLimits.midiBytes)
    throw new LibraryError(413, 'MIDI files can be up to 2 MB.');
  if (b.length < 22 || ascii(b, 0, 4) !== 'MThd')
    throw new LibraryError(415, 'This is not a MIDI file.');
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const length = view.getUint32(4);
  const format = view.getUint16(8);
  const tracks = view.getUint16(10);
  const division = view.getUint16(12);
  if (length !== 6 || format > 2 || tracks < 1 || division === 0)
    throw new LibraryError(422, 'The MIDI header is invalid.');
  if (ascii(b, 14, 18) !== 'MTrk') throw new LibraryError(422, 'The MIDI file has no tracks.');
}

/* ---------------- songs ---------------- */

export interface UploadInput {
  type: UploadType;
  title: string;
  tags: string[];
  rights: RightsAttestation;
  files: NamedBytes[];
  midi?: Uint8Array;
}

const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

export function parseUploadType(value: unknown): UploadType {
  if (typeof value !== 'string' || !(uploadTypes as readonly string[]).includes(value))
    throw new LibraryError(422, 'Choose what you are uploading.');
  return value as UploadType;
}

export function parseTitle(value: unknown): string {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title || title.length > 120)
    throw new LibraryError(422, 'Give it a title (1–120 characters).');
  return title;
}

export function parseTags(...values: unknown[]): string[] {
  const tags = values
    .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
    .map((t) => t.trim())
    .filter(Boolean);
  const unique = [...new Set(tags)];
  if (unique.length > 20 || unique.some((t) => t.length > 40))
    throw new LibraryError(422, 'Use at most 20 tags of up to 40 characters.');
  return unique;
}

/** Stores the originals untouched, makes a FLAC playable copy (and stem buses), saves a library song. */
export async function importSong(
  library: SongLibrary,
  input: UploadInput,
  now: Date
): Promise<SongMeta> {
  const stems = input.type === 'stems';
  if (input.files.length === 0) throw new LibraryError(422, 'Choose a file to upload.');
  if (!stems && input.files.length > 1) throw new LibraryError(422, 'Upload one file at a time.');
  if (stems && input.files.length < 2)
    throw new LibraryError(422, 'Stems need at least two audio files (or one ZIP).');
  if (input.files.length > uploadLimits.maxStems)
    throw new LibraryError(422, 'Upload up to 16 stems at once.');
  if (input.type === 'midi') {
    if (!input.midi) throw new LibraryError(422, 'Include the original MIDI file.');
    validateMidi(input.midi);
  }
  const formats = input.files.map((f) => checkAudioFile(f.name, f.bytes));

  const { id, dir } = await library.reserve();
  try {
    await mkdir(path.join(dir, 'originals'), { recursive: true });
    const originals: UploadOriginal[] = [];
    const files: string[] = [];
    let duration = 0;
    let hadVideo = false;
    for (const [i, f] of input.files.entries()) {
      const rel = 'originals/' + String(i + 1).padStart(2, '0') + '.' + formats[i];
      const abs = path.join(dir, rel);
      await writeFile(abs, f.bytes);
      const probe = await probeMedia(abs);
      if (!probe.hasAudio)
        throw new LibraryError(
          422,
          probe.hasVideo ? 'This video has no sound.' : 'This file has no audio.'
        );
      if (probe.duration > uploadLimits.maxSeconds)
        throw new LibraryError(422, 'Audio can be up to 15 minutes long.');
      duration = Math.max(duration, probe.duration);
      hadVideo ||= probe.hasVideo;
      files.push(abs);
      originals.push({
        file: rel,
        content_type: mimeFor[formats[i]],
        bytes: f.bytes.length,
        format: formats[i],
        sha256: sha256(f.bytes),
        ...(stems ? { stem: stemBus(f.name) } : {})
      });
    }
    if (input.type === 'video' && !hadVideo)
      throw new LibraryError(
        422,
        'This file has no video; choose Song, Beat or Recording instead.'
      );

    // Every file is decoded in full; stems are summed per bus, then all of it into the main mix.
    const decoded: string[] = [];
    for (const [i, abs] of files.entries()) {
      const out = path.join(dir, 'originals', 'decoded-' + i + '.flac');
      await decodeToFlac(abs, out);
      decoded.push(out);
    }
    const storedStems: (StoredAudio & { name: StemName })[] = [];
    if (stems) {
      const buses: StemName[] = ['vocals', 'drums', 'bass', 'other'];
      for (const name of buses) {
        const members = decoded.filter((_, i) => originals[i].stem === name);
        if (!members.length) continue;
        const rel = 'stems/' + name + '.flac';
        await mixToFlac(members, path.join(dir, rel));
        storedStems.push({
          name,
          file: rel,
          content_type: 'audio/flac',
          bytes: Bun.file(path.join(dir, rel)).size
        });
      }
    }
    const main = path.join(dir, 'audio.flac');
    if (stems) await mixToFlac(decoded, main);
    else await rename(decoded[0], main);
    for (const f of decoded) await rm(f, { force: true });

    let midi: (StoredAudio & { sha256: string }) | undefined;
    if (input.midi) {
      await writeFile(path.join(dir, 'originals', 'source.mid'), input.midi);
      midi = {
        file: 'originals/source.mid',
        content_type: 'audio/midi',
        bytes: input.midi.length,
        sha256: sha256(input.midi)
      };
    }

    const meta: SongMeta = {
      id,
      title: input.title,
      prompt: input.tags.join(', '),
      style_tags: input.tags,
      lyrics: null,
      engine: 'upload',
      params: { upload_type: input.type },
      created_at: now.toISOString(),
      parent_id: null,
      kind: 'upload',
      favourite: false,
      audio: { file: 'audio.flac', content_type: 'audio/flac', bytes: Bun.file(main).size },
      ...(storedStems.length ? { stems: storedStems } : {}),
      upload: {
        type: input.type,
        originals,
        ...(midi ? { midi } : {}),
        duration_seconds: Math.round(duration * 100) / 100,
        had_video: hadVideo,
        rights: input.rights
      },
      est_cost_usd: 0
    };
    await library.save(meta);
    return meta;
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

/* ---------------- lyrics ---------------- */

export const lyricsExtensions = ['txt', 'md', 'lrc', 'srt', 'vtt', 'docx', 'pdf'] as const;

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    }
    return entities[code.toLowerCase()] ?? all;
  });
}

export function normaliseLyrics(text: string): string {
  return (
    text
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      // eslint-disable-next-line no-control-regex -- strips stray control characters from uploaded text
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/g, ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

export function stripLrc(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !/^\s*\[(ar|ti|al|au|by|length|offset|re|ve|#):/i.test(line))
    .map((line) =>
      line
        .replace(/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/g, '')
        .replace(/<\d{1,3}:\d{2}(?:[.:]\d{1,3})?>/g, '')
        .trim()
    )
    .join('\n');
}

const cueTime = /^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->/;

export function stripSubtitles(text: string, vtt: boolean): string {
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n{2,}/);
  const out: string[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    if (vtt && /^(WEBVTT|NOTE|STYLE|REGION)\b/.test(lines[0].trim())) continue;
    const timeAt = lines.findIndex((l) => cueTime.test(l));
    const body =
      timeAt >= 0 ? lines.slice(timeAt + 1) : lines.filter((l) => !/^\s*\d+\s*$/.test(l));
    const cleaned = body
      .map((l) =>
        decodeEntities(l.replace(/<[^>]*>/g, ''))
          .replace(/\{\\[^}]*\}/g, '')
          .trim()
      )
      .filter(Boolean);
    if (cleaned.length) out.push(cleaned.join('\n'));
  }
  // Subtitles split one lyric line per cue; keep cues as lines.
  return out.join('\n');
}

export function docxText(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' });
  } catch {
    throw new LibraryError(422, 'The Word file could not be opened.');
  }
  const xml = files['word/document.xml'];
  if (!xml) throw new LibraryError(422, 'The Word file has no document text.');
  if (xml.length > 20 * 1024 * 1024) throw new LibraryError(413, 'The Word file is too large.');
  const doc = new TextDecoder().decode(xml);
  const token = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:(?:br|cr)\b[^>]*\/>|<w:tab\b[^>]*\/>/g;
  return doc
    .split(/<\/w:p>/)
    .map((paragraph) => {
      let line = '';
      for (const m of paragraph.matchAll(token))
        line += m[1] !== undefined ? decodeEntities(m[1]) : m[0].startsWith('<w:tab') ? '\t' : '\n';
      return line;
    })
    .join('\n');
}

export async function pdfText(bytes: Uint8Array): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: false });
    return (text as string[]).join('\n\n');
  } catch {
    throw new LibraryError(422, 'The PDF could not be read.');
  }
}

/** Plain lyric text from a file; timestamps, cue numbers and markup are removed. */
export async function extractLyrics(
  name: string,
  bytes: Uint8Array
): Promise<{ text: string; source: string }> {
  if (bytes.length > uploadLimits.lyricsFileBytes)
    throw new LibraryError(413, 'Lyric files can be up to 5 MB.');
  const ext = extensionOf(name);
  const utf8 = () => new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isPdf = ascii(bytes, 0, 5) === '%PDF-';
  let text: string;
  if (ext === 'docx') {
    if (!isZip) throw new LibraryError(415, 'This is not a Word (.docx) file.');
    text = docxText(bytes);
  } else if (ext === 'pdf') {
    if (!isPdf) throw new LibraryError(415, 'This is not a PDF file.');
    text = await pdfText(bytes);
  } else if (ext === 'txt' || ext === 'md' || ext === 'lrc' || ext === 'srt' || ext === 'vtt') {
    if (isZip || isPdf || bytes.subarray(0, 4096).includes(0))
      throw new LibraryError(415, 'This does not look like a text file.');
    const raw = utf8();
    text =
      ext === 'lrc'
        ? stripLrc(raw)
        : ext === 'srt' || ext === 'vtt'
          ? stripSubtitles(raw, ext === 'vtt')
          : raw;
  } else throw new LibraryError(415, 'Lyrics can be .txt, .md, .lrc, .srt, .vtt, .docx or .pdf.');
  return { text: checkLyricsText(text), source: ext };
}

export function checkLyricsText(raw: string): string {
  const text = normaliseLyrics(raw);
  if (!text) throw new LibraryError(422, 'No lyrics were found in it.');
  if (text.length > uploadLimits.lyricsChars)
    throw new LibraryError(422, 'Lyrics can be up to 15,000 characters.');
  return text;
}

const sheetId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function isSheet(value: unknown): value is LyricSheet {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    sheetId.test(s.id) &&
    typeof s.title === 'string' &&
    typeof s.text === 'string' &&
    typeof s.created_at === 'string'
  );
}

/** Reusable lyric sheets: <root>/studio/lyrics/<id>.json. */
export class LyricSheets {
  readonly dir: string;
  constructor(root: string) {
    this.dir = path.join(root, 'studio', 'lyrics');
  }

  private file(id: string): string {
    if (!sheetId.test(id)) throw new LibraryError(404, 'Lyric sheet not found.');
    return path.join(this.dir, id + '.json');
  }

  async add(input: Omit<LyricSheet, 'id'>): Promise<LyricSheet> {
    const sheet: LyricSheet = { id: crypto.randomUUID(), ...input };
    await mkdir(this.dir, { recursive: true });
    const target = this.file(sheet.id);
    await writeFile(target + '.tmp', JSON.stringify(sheet, null, 2));
    await rename(target + '.tmp', target);
    return sheet;
  }

  async get(id: string): Promise<LyricSheet> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(this.file(id), 'utf8'));
    } catch (error) {
      if (error instanceof LibraryError) throw error;
      throw new LibraryError(404, 'Lyric sheet not found.');
    }
    if (!isSheet(parsed) || parsed.id !== id)
      throw new LibraryError(500, 'Lyric sheet is corrupt.');
    return parsed;
  }

  async list(): Promise<LyricSheet[]> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return [];
    }
    const out: LyricSheet[] = [];
    for (const name of names.sort()) {
      const id = name.replace(/\.json$/, '');
      if (!name.endsWith('.json') || !sheetId.test(id)) continue;
      try {
        out.push(await this.get(id));
      } catch {
        // Corrupt sheets are skipped.
      }
    }
    return out.sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await rm(this.file(id), { force: true });
  }
}

/* ---------------- multipart helpers ---------------- */

export async function readForm(request: Request): Promise<FormData> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > uploadLimits.requestBytes) throw new LibraryError(413, 'The upload is too large.');
  try {
    return await request.formData();
  } catch {
    throw new LibraryError(400, 'Send the upload as multipart form data.');
  }
}

export async function formFiles(form: FormData, field: string): Promise<NamedBytes[]> {
  const out: NamedBytes[] = [];
  for (const value of form.getAll(field)) {
    if (typeof value === 'string') continue;
    if (value.size > uploadLimits.fileBytes)
      throw new LibraryError(413, 'Each file can be up to 200 MB.');
    out.push({ name: value.name ?? '', bytes: new Uint8Array(await value.arrayBuffer()) });
  }
  return out;
}

/** Builds the import input from a multipart form; a single .zip in a stems upload is unpacked. */
export async function uploadInputFromForm(form: FormData, now: Date): Promise<UploadInput> {
  const rights = rightsFrom(form.get('rights'), now);
  const type = parseUploadType(form.get('type'));
  const title = parseTitle(form.get('title'));
  const tags = parseTags(form.get('genre'), form.get('tags'));
  let files = await formFiles(form, 'file');
  if (type === 'stems' && files.length === 1 && extensionOf(files[0].name) === 'zip')
    files = unzipStems(files[0].bytes);
  const midi = (await formFiles(form, 'midi'))[0]?.bytes;
  return { type, title, tags, rights, files, ...(midi ? { midi } : {}) };
}
