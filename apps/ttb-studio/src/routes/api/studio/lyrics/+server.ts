import { validateLyricsRequest, type LyricsRequest } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../lib/server/studio/context';
import { runLyricist } from '../../../../lib/server/studio/lyrics';

export const POST: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = await readJson(request);
  const invalid = validateLyricsRequest(body);
  if (invalid) return Response.json({ detail: invalid }, { status: 422 });
  const ctx = studioContext(fetch);
  if (!ctx.replicate)
    return Response.json({ detail: 'The lyricist needs REPLICATE_API_TOKEN.' }, { status: 503 });
  try {
    return Response.json(await runLyricist(ctx.replicate, body as LyricsRequest), {
      headers: noStore
    });
  } catch (error) {
    return studioError(error);
  }
};
