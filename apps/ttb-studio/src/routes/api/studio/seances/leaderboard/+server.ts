import type { RequestHandler } from './$types';
import { guard, noStore } from '../../../../../lib/server/studio/context';
import { seanceLeaderboard } from '../../../../../lib/server/studio/seance';
import { seanceDeps } from '../_deps';

export const GET: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  return Response.json(
    { leaderboard: await seanceLeaderboard(seanceDeps(fetch)) },
    { headers: noStore }
  );
};
