import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  isSoundId,
  maxUploadBytes,
  soundCategories,
  type SoundCategory,
  type SoundMeta,
  type SoundSource
} from '@vbm/contracts';
import { sniffAudio } from '../music/audio';
import { ProviderError } from '../music/errors';
import { extensionFor, LibraryError } from '../studio/library';
import { analyse, autoTags, decodeMono, ffmpeg, playableArgs } from './analyse';

export interface AddSound {
  bytes: Uint8Array;
  name: string;
  category: SoundCategory;
  tags?: string[];
  source: SoundSource;
}

export interface SoundFilter {
  q?: string;
  category?: SoundCategory;
  favourite?: boolean;
}

const tagPattern = /^[\p{L}\p{N} -]{1,24}$/u;

function isMeta(value: unknown): value is SoundMeta {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  const audio = m.audio as Record<string, unknown> | undefined;
  return (
    isSoundId(m.id) &&
    typeof m.name === 'string' &&
    (soundCategories as readonly unknown[]).includes(m.category) &&
    Array.isArray(m.tags) &&
    typeof m.duration_seconds === 'number' &&
    typeof m.hit_seconds === 'number' &&
    !!audio &&
    typeof audio.file === 'string' &&
    !!m.source &&
    typeof m.source === 'object'
  );
}

export function cleanTags(tags: unknown): string[] | null {
  if (!Array.isArray(tags) || tags.length > 12) return null;
  const out: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') return null;
    const t = tag.trim().toLowerCase();
    if (!tagPattern.test(t)) return null;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

/** File-backed sound library: <root>/studio/sounds/<id>/{original.*, sound.wav, meta.json}. */
export class SoundLibrary {
  readonly soundsDir: string;
  constructor(
    readonly root: string,
    private readonly now: () => Date = () => new Date()
  ) {
    this.soundsDir = path.join(root, 'studio', 'sounds');
  }

  soundDir(id: string): string {
    if (!isSoundId(id)) throw new LibraryError(404, 'Sound not found.');
    return path.join(this.soundsDir, id);
  }

  /** Stores the bytes unchanged, verifies them by a full decode, then writes the playable WAV. */
  async add(input: AddSound): Promise<SoundMeta> {
    if (input.bytes.length > maxUploadBytes)
      throw new ProviderError(413, 'Sounds can be at most 20 MB.');
    const kind = sniffAudio(input.bytes);
    if (!kind)
      throw new ProviderError(415, 'The file is not recognisable audio (WAV, MP3, FLAC or OGG).');
    const name = input.name.trim().slice(0, 80) || 'Untitled sound';
    const id = crypto.randomUUID();
    const dir = this.soundDir(id);
    await mkdir(dir, { recursive: true });
    try {
      const originalName = 'original.' + extensionFor(kind);
      const original = path.join(dir, originalName);
      await writeFile(original, input.bytes);
      const samples = await decodeMono(original);
      const measured = analyse(samples);
      if (measured.duration_seconds < 0.02)
        throw new ProviderError(422, 'The audio is too short to use as a sound.');
      if (measured.features.peak_db < -70) throw new ProviderError(422, 'The audio is silent.');
      await ffmpeg(
        playableArgs(original, path.join(dir, 'sound.wav')),
        'The sound could not be converted.'
      );
      const playable = await stat(path.join(dir, 'sound.wav'));
      const meta: SoundMeta = {
        id,
        name,
        category: input.category,
        tags: [...new Set([...autoTags(measured.features), ...(input.tags ?? [])])],
        favourite: false,
        created_at: this.now().toISOString(),
        ...measured,
        audio: { file: 'sound.wav', content_type: 'audio/wav', bytes: playable.size },
        original: { file: originalName, content_type: kind, bytes: input.bytes.length },
        source: input.source
      };
      await this.save(meta);
      return meta;
    } catch (error) {
      await rm(dir, { recursive: true, force: true });
      throw error;
    }
  }

  async save(meta: SoundMeta): Promise<void> {
    const dir = this.soundDir(meta.id);
    // Unique per write so two concurrent edits cannot consume each other's temp file.
    const tmp = path.join(dir, 'meta.json.' + crypto.randomUUID() + '.tmp');
    await writeFile(tmp, JSON.stringify(meta, null, 2));
    await rename(tmp, path.join(dir, 'meta.json'));
  }

  async get(id: string): Promise<SoundMeta> {
    let raw: string;
    try {
      raw = await readFile(path.join(this.soundDir(id), 'meta.json'), 'utf8');
    } catch {
      throw new LibraryError(404, 'Sound not found.');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new LibraryError(500, 'Sound metadata is corrupt.');
    }
    if (!isMeta(parsed) || parsed.id !== id)
      throw new LibraryError(500, 'Sound metadata is corrupt.');
    return parsed;
  }

  async list(filter: SoundFilter = {}): Promise<SoundMeta[]> {
    let names: string[];
    try {
      names = await readdir(this.soundsDir);
    } catch {
      return [];
    }
    const q = filter.q?.trim().toLowerCase();
    const sounds: SoundMeta[] = [];
    for (const name of names.filter(isSoundId)) {
      let meta: SoundMeta;
      try {
        meta = await this.get(name);
      } catch {
        continue;
      }
      if (filter.category && meta.category !== filter.category) continue;
      if (filter.favourite && !meta.favourite) continue;
      if (
        q &&
        !(meta.name + ' ' + meta.category + ' ' + meta.tags.join(' ')).toLowerCase().includes(q)
      )
        continue;
      sounds.push(meta);
    }
    return sounds.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }

  async update(
    id: string,
    patch: { name?: string; tags?: string[]; favourite?: boolean; category?: SoundCategory }
  ): Promise<SoundMeta> {
    const meta = await this.get(id);
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name || name.length > 80) throw new LibraryError(422, 'Name must be 1–80 characters.');
      meta.name = name;
    }
    if (patch.tags !== undefined) meta.tags = patch.tags;
    if (patch.favourite !== undefined) meta.favourite = patch.favourite;
    if (patch.category !== undefined) meta.category = patch.category;
    await this.save(meta);
    return meta;
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await rm(this.soundDir(id), { recursive: true, force: true });
  }

  /** The playable WAV named in meta; never a client path. */
  async audioFile(id: string): Promise<{ file: string; size: number; meta: SoundMeta }> {
    const meta = await this.get(id);
    const dir = this.soundDir(id);
    const file = path.resolve(dir, meta.audio.file);
    if (!file.startsWith(dir + path.sep)) throw new LibraryError(404, 'Sound not found.');
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) throw new LibraryError(404, 'The audio file for this sound is missing.');
    return { file, size: info.size, meta };
  }
}
