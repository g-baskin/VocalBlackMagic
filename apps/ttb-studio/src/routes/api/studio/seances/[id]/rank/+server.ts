import { type SeanceLabel } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import { guard, noStore, readJson } from '../../../../../../lib/server/studio/context';
import { rankSeance } from '../../../../../../lib/server/studio/seance';
import { seanceDeps, seanceError } from '../../_deps';

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = (await readJson(request)) as { order?: unknown } | undefined;
  const order = body?.order;
  if (!Array.isArray(order) || !order.every((l) => typeof l === 'string'))
    return Response.json({ detail: 'order must list the takes, best first.' }, { status: 422 });
  try {
    return Response.json(
      { seance: await rankSeance(seanceDeps(fetch), params.id, order as SeanceLabel[]) },
      { headers: noStore }
    );
  } catch (error) {
    return seanceError(error);
  }
};
