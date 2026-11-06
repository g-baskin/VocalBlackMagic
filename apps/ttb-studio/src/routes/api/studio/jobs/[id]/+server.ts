import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  studioContext,
  studioError
} from '../../../../../lib/server/studio/context';
import { advanceJob, cancelJob } from '../../../../../lib/server/studio/jobs';

export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json(
      { job: await advanceJob(studioContext(fetch), params.id) },
      { headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json(
      { job: await cancelJob(studioContext(fetch), params.id) },
      { headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};
