import { validateCreateSongRequest, type CreateSongRequest } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../lib/server/studio/context';
import { createSongs } from '../../../../lib/server/studio/create';
import { sealSongs } from '../../../../lib/server/studio/seal';

export const GET: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  const library = studioContext(fetch).library;
  return Response.json(
    { songs: await sealSongs(library.root, await library.list()) },
    { headers: noStore }
  );
};

export const POST: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = await readJson(request);
  const invalid = validateCreateSongRequest(body);
  if (invalid) return Response.json({ detail: invalid }, { status: 422 });
  try {
    const result = await createSongs(studioContext(fetch), body as CreateSongRequest);
    return Response.json(result, { status: 202, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
