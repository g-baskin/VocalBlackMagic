import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { startReimagine } from '../../../../../../lib/server/studio/derive';

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = ((await readJson(request)) ?? {}) as { lyrics?: unknown; title?: unknown };
  const lyrics =
    typeof body.lyrics === 'string' && body.lyrics.length <= 15000 ? body.lyrics : null;
  const title = typeof body.title === 'string' && body.title.length <= 120 ? body.title : null;
  try {
    const job = await startReimagine(studioContext(fetch), params.id, { lyrics, title });
    return Response.json({ job }, { status: 202, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
