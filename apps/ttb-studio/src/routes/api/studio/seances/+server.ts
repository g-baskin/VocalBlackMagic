import { validateSeanceRequest, type SeanceRequest } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import { guard, noStore, readJson } from '../../../../lib/server/studio/context';
import { listSeances, startSeance } from '../../../../lib/server/studio/seance';
import { seanceDeps, seanceError } from './_deps';

export const GET: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  return Response.json({ seances: await listSeances(seanceDeps(fetch)) }, { headers: noStore });
};

export const POST: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = await readJson(request);
  const invalid = validateSeanceRequest(body);
  if (invalid) return Response.json({ detail: invalid }, { status: 422 });
  try {
    const seance = await startSeance(seanceDeps(fetch), body as SeanceRequest);
    return Response.json({ seance }, { status: 202, headers: noStore });
  } catch (error) {
    return seanceError(error);
  }
};
