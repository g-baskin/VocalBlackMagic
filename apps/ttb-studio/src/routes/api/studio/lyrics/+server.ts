import { validateLyricsRequest, type LyricsRequest } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../lib/server/studio/context';
import { lyricistChain } from '../../../../lib/server/studio/create';
import { runLyricistChain } from '../../../../lib/server/studio/lyrics';

export const POST: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = await readJson(request);
  const invalid = validateLyricsRequest(body);
  if (invalid) return Response.json({ detail: invalid }, { status: 422 });
  const ctx = studioContext(fetch);
  try {
    return Response.json(await runLyricistChain(lyricistChain(ctx), body as LyricsRequest), {
      headers: noStore
    });
  } catch (error) {
    return studioError(error);
  }
};
