import type { RequestHandler } from './$types';
import { guard, studioContext, studioError } from '../../../../../../lib/server/studio/context';
import { extensionFor, parseWhich } from '../../../../../../lib/server/studio/library';
import { fileResponse } from '../../../../../../lib/server/studio/range';

export const GET: RequestHandler = async ({ request, params, url, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  const which = parseWhich(url.searchParams.get('stem'));
  if (!which) return Response.json({ detail: 'Unknown stem.' }, { status: 404 });
  try {
    const library = studioContext(fetch).library;
    const audio = await library.audioFile(params.id, which);
    const download = url.searchParams.get('download') === '1';
    const meta = download ? await library.get(params.id) : null;
    const name = meta
      ? meta.title + (which === 'main' ? '' : ' - ' + which) + '.' + extensionFor(audio.contentType)
      : undefined;
    return fileResponse(
      audio.file,
      audio.size,
      audio.contentType,
      request.headers.get('range'),
      name
    );
  } catch (error) {
    return studioError(error);
  }
};
