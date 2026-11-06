import type { RequestHandler } from './$types';
import { errorResponse } from '../../../../../lib/server/errors';
import { guardMutation } from '../../../../../lib/server/gate';
import { svc } from '../../../../../lib/server/svc';

export const POST: RequestHandler = async ({ params, request }) => {
  const blocked = guardMutation(request, { json: true });
  if (blocked) return blocked;
  try {
    return Response.json(await svc().diagnose(params.id));
  } catch (error) {
    return errorResponse(error);
  }
};
