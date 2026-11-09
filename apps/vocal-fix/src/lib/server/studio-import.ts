import { realpath, stat } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { studioSongId, STUDIO_IMPORT_LIMIT, type StudioImportSource } from '../studio-import';
import { errorResponse, VocalFixError } from './errors';
import { disabledResponse, hostGuard, ownerGuard } from './gate';
import { dataDir } from './paths';
import { fileResponse } from './range';

const TYPES: Record<string, string> = {
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/flac': 'flac',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/webm': 'webm'
};
const META_LIMIT = 128 * 1024;

/** Read-only adapter, not a dependency on the other app's server implementation. */
export async function readStudioSource(
  root: string,
  id: string
): Promise<{ source: StudioImportSource; path: string }> {
  if (!studioSongId.test(id)) throw new VocalFixError('Invalid Studio song.', 404);
  try {
    const library = await realpath(join(root, 'studio', 'songs'));
    const folder = await realpath(join(library, id));
    // UUID folders and files must not escape the private library through paths or symlinks.
    if (folder !== join(library, id)) throw new VocalFixError('Invalid Studio song location.', 404);
    const metadataPath = await realpath(join(folder, 'meta.json'));
    if (metadataPath !== join(folder, 'meta.json'))
      throw new VocalFixError('Invalid Studio song metadata.', 404);
    const metadata = Bun.file(metadataPath);
    if (metadata.size > META_LIMIT)
      throw new VocalFixError('Studio song metadata is too large.', 413);
    const text = await metadata.slice(0, META_LIMIT + 1).text();
    if (new TextEncoder().encode(text).length > META_LIMIT)
      throw new VocalFixError('Studio song metadata is too large.', 413);
    let song: Record<string, unknown>;
    try {
      song = JSON.parse(text);
    } catch {
      throw new VocalFixError('Studio song metadata could not be read.', 422);
    }
    if (
      !song ||
      song.id !== id ||
      typeof song.title !== 'string' ||
      !song.audio ||
      typeof song.audio !== 'object'
    )
      throw new VocalFixError('This Studio song has no audio to import.', 422);
    const audio = song.audio as Record<string, unknown>;
    if (typeof audio.file !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(audio.file))
      throw new VocalFixError('Invalid Studio audio file.', 422);
    if (typeof audio.content_type !== 'string' || !Object.hasOwn(TYPES, audio.content_type))
      throw new VocalFixError('This audio format cannot be imported into Vocal Fix.', 422);
    const path = await realpath(join(folder, audio.file));
    if (!path.startsWith(folder + sep))
      throw new VocalFixError('Invalid Studio audio location.', 404);
    const info = await stat(path);
    if (!info.isFile() || info.size === 0)
      throw new VocalFixError('Studio audio is empty or unavailable.', 422);
    if (info.size > STUDIO_IMPORT_LIMIT)
      throw new VocalFixError('This song exceeds Vocal Fix’s 100 MB limit.', 413);
    const title = song.title.trim().slice(0, 120) || 'Studio song';
    const filename =
      (title.replace(/[^\p{L}\p{N} ._-]/gu, '_') || 'Studio song') +
      '.' +
      TYPES[audio.content_type];
    return {
      path,
      source: { id, title, filename, bytes: info.size, content_type: audio.content_type }
    };
  } catch (error) {
    if (error instanceof VocalFixError) throw error;
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ['ENOENT', 'ENOTDIR'].includes(String(error.code))
    )
      throw new VocalFixError('Studio song not found. It may have been deleted.', 404);
    throw error;
  }
}

export async function studioImportResponse(
  request: Request,
  id: string,
  root = dataDir()
): Promise<Response> {
  // Enforce access here as well as in hooks, including in direct handler tests.
  const blocked = ownerGuard(request) ?? hostGuard(request) ?? disabledResponse();
  if (blocked) return blocked;
  try {
    const { source, path } = await readStudioSource(root, id);
    if (new URL(request.url).searchParams.get('audio') === '1')
      return fileResponse(path, source.bytes, source.content_type, request.headers.get('range'));
    return Response.json(source, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
