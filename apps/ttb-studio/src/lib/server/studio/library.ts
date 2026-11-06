import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { songKinds, stemNames, type SongMeta, type StemName } from '@vbm/contracts';

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class LibraryError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}

export function isSongId(id: string): boolean {
  return idPattern.test(id);
}

const extensions: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
  'audio/ogg': 'ogg'
};
export function extensionFor(contentType: string): string {
  return extensions[contentType] ?? 'bin';
}

function isMeta(value: unknown): value is SongMeta {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    isSongId(m.id) &&
    typeof m.title === 'string' &&
    typeof m.created_at === 'string' &&
    typeof m.kind === 'string' &&
    (songKinds as readonly string[]).includes(m.kind)
  );
}

/** File-backed song library: <root>/studio/songs/<id>/{meta.json, audio files}. */
export class SongLibrary {
  readonly songsDir: string;
  constructor(readonly root: string) {
    this.songsDir = path.join(root, 'studio', 'songs');
  }

  songDir(id: string): string {
    if (!isSongId(id)) throw new LibraryError(404, 'Song not found.');
    return path.join(this.songsDir, id);
  }

  /** Reserves a new song folder; the caller writes audio then calls save(). */
  async reserve(): Promise<{ id: string; dir: string }> {
    const id = crypto.randomUUID();
    const dir = this.songDir(id);
    await mkdir(path.join(dir, 'stems'), { recursive: true });
    return { id, dir };
  }

  async save(meta: SongMeta): Promise<void> {
    const dir = this.songDir(meta.id);
    await mkdir(dir, { recursive: true });
    const tmp = path.join(dir, 'meta.json.tmp');
    await writeFile(tmp, JSON.stringify(meta, null, 2));
    await rename(tmp, path.join(dir, 'meta.json'));
  }

  async get(id: string): Promise<SongMeta> {
    let raw: string;
    try {
      raw = await readFile(path.join(this.songDir(id), 'meta.json'), 'utf8');
    } catch {
      throw new LibraryError(404, 'Song not found.');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new LibraryError(500, 'Song metadata is corrupt.');
    }
    if (!isMeta(parsed) || parsed.id !== id)
      throw new LibraryError(500, 'Song metadata is corrupt.');
    return parsed;
  }

  async list(): Promise<SongMeta[]> {
    let names: string[];
    try {
      names = await readdir(this.songsDir);
    } catch {
      return [];
    }
    const songs: SongMeta[] = [];
    for (const name of names.filter(isSongId).sort()) {
      try {
        songs.push(await this.get(name));
      } catch {
        // Half-written or corrupt folders are skipped, not fatal for the whole library.
      }
    }
    return songs.sort(
      (a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id)
    );
  }

  async update(id: string, patch: { title?: string; favourite?: boolean }): Promise<SongMeta> {
    const meta = await this.get(id);
    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (!title || title.length > 120)
        throw new LibraryError(422, 'Title must be 1–120 characters.');
      meta.title = title;
    }
    if (patch.favourite !== undefined) meta.favourite = patch.favourite;
    await this.save(meta);
    return meta;
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await rm(this.songDir(id), { recursive: true, force: true });
  }

  /** Resolves a file named in meta (never a client path) inside the song folder. */
  async assetFile(id: string, relative: string): Promise<string> {
    const dir = this.songDir(id);
    const file = path.resolve(dir, relative);
    if (!file.startsWith(dir + path.sep)) throw new LibraryError(404, 'Not found.');
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) throw new LibraryError(404, 'The file for this song is missing.');
    return file;
  }

  async coverFile(id: string): Promise<{ file: string; contentType: string; size: number }> {
    const meta = await this.get(id);
    if (!meta.cover) throw new LibraryError(404, 'This song has no cover.');
    const file = await this.assetFile(id, meta.cover.file);
    return { file, contentType: meta.cover.content_type, size: (await stat(file)).size };
  }

  /** Resolves a stored audio file: 'main' or a stem name. Never trusts a client path. */
  async audioFile(
    id: string,
    which: 'main' | StemName
  ): Promise<{ file: string; contentType: string; size: number }> {
    const meta = await this.get(id);
    const entry =
      which === 'main' ? meta.audio : (meta.stems?.find((stem) => stem.name === which) ?? null);
    if (!entry) throw new LibraryError(404, 'This song has no such audio.');
    const dir = this.songDir(id);
    const file = path.resolve(dir, entry.file);
    if (!file.startsWith(dir + path.sep))
      throw new LibraryError(404, 'This song has no such audio.');
    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error('not a file');
      return { file, contentType: entry.content_type, size: info.size };
    } catch {
      throw new LibraryError(404, 'The audio file for this song is missing.');
    }
  }
}

export function parseWhich(raw: string | null): 'main' | StemName | null {
  if (raw === null || raw === '' || raw === 'main') return 'main';
  return (stemNames as readonly string[]).includes(raw) ? (raw as StemName) : null;
}
