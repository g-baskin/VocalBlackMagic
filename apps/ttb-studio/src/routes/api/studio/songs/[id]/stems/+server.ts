import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { startStems } from '../../../../../../lib/server/studio/derive';

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  try {
    return Response.json(
      { job: await startStems(studioContext(fetch), params.id) },
      { status: 202, headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};
