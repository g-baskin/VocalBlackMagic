import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { masterSong } from '../../../../../../lib/server/studio/derive';

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  try {
    return Response.json(
      { song: await masterSong(studioContext(fetch), params.id) },
      { status: 201, headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};
