import type { RequestHandler } from './$types';
import { errorResponse } from '../../../../../../lib/server/errors';
import { disabledResponse, guardMutation, jsonError } from '../../../../../../lib/server/gate';
import { svc } from '../../../../../../lib/server/svc';

export const GET: RequestHandler = async ({ params }) => {
  const blocked = disabledResponse();
  if (blocked) return blocked;
  try {
    const s = svc();
    const job = await s.jobs.get(s.store.sessionDir(params.id), params.job);
    if (job.session_id !== params.id) return jsonError('Unknown job.', 404);
    return Response.json(job, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
  const blocked = guardMutation(request, { json: false });
  if (blocked) return blocked;
  if (!svc().jobs.cancel(params.id, params.job)) return jsonError('Job is not running.', 409);
  return Response.json({ cancelled: true }, { status: 202 });
};
