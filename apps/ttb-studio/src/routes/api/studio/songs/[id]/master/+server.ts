import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { masterSong } from '../../../../../../lib/server/studio/derive';

import { masterPresetRequest } from '../../../../../../lib/server/studio/master';

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  try {
    const preset = masterPresetRequest(await readJson(request));
    return Response.json(
      { song: await masterSong(studioContext(fetch), params.id, preset) },
      { status: 201, headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};
