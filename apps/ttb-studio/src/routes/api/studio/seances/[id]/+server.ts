import type { RequestHandler } from './$types';
import { guard, noStore } from '../../../../../lib/server/studio/context';
import { getSeance } from '../../../../../lib/server/studio/seance';
import { seanceDeps, seanceError } from '../_deps';

export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json(
      { seance: await getSeance(seanceDeps(fetch), params.id) },
      { headers: noStore }
    );
  } catch (error) {
    return seanceError(error);
  }
};
