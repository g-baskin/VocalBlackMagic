import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { conjureCover } from '../../../../../../lib/server/studio/cover';
import { fileResponse } from '../../../../../../lib/server/studio/range';

export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    const cover = await studioContext(fetch).library.coverFile(params.id);
    return fileResponse(cover.file, cover.size, cover.contentType, request.headers.get('range'));
  } catch (error) {
    return studioError(error);
  }
};

/** Re-conjures cover art (flux-schnell, about $0.003). */
export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const ctx = studioContext(fetch);
  if (!ctx.replicate)
    return Response.json({ detail: 'Cover art needs REPLICATE_API_TOKEN.' }, { status: 503 });
  try {
    const song = await conjureCover(ctx.library, ctx.replicate, params.id);
    return Response.json({ song }, { status: 201, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
