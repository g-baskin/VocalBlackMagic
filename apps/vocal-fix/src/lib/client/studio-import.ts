import { apiPath } from '../base';
import { STUDIO_IMPORT_LIMIT, studioSongId, type StudioImportSource } from '../studio-import';

export async function loadStudioSong(
  id: string,
  signal: AbortSignal,
  fetcher: (url: string, init?: RequestInit) => Promise<Response> = fetch
): Promise<{ source: StudioImportSource; file: File }> {
  if (!studioSongId.test(id))
    throw new Error('This Studio song link is invalid. Open the song from Studio again.');
  const url = apiPath('/api/studio-import/' + id);
  const metadata = await fetcher(url, { signal });
  const source = await metadata.json().catch(() => null);
  if (!metadata.ok)
    throw new Error(source?.detail ?? 'Studio song could not be loaded. Sign in and try again.');
  if (
    !source ||
    source.id !== id ||
    typeof source.title !== 'string' ||
    typeof source.filename !== 'string' ||
    typeof source.content_type !== 'string' ||
    !Number.isSafeInteger(source.bytes) ||
    source.bytes < 1 ||
    source.bytes > STUDIO_IMPORT_LIMIT
  )
    throw new Error('Studio returned an invalid or oversized audio file.');
  const response = await fetcher(url + '?audio=1', { signal });
  if (!response.ok || !response.body)
    throw new Error('The song audio could not be loaded. Try again.');
  const declared = Number(response.headers.get('content-length'));
  if (declared > STUDIO_IMPORT_LIMIT) {
    await response.body.cancel();
    throw new Error('This song exceeds the 100 MB limit.');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let bytes = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > STUDIO_IMPORT_LIMIT || bytes > source.bytes)
        throw new Error('The audio changed or exceeds the import limit. Open the song again.');
      chunks.push(new Uint8Array(next.value));
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (bytes !== source.bytes) throw new Error('The audio download was incomplete. Try again.');
  return { source, file: new File(chunks, source.filename, { type: source.content_type }) };
}
