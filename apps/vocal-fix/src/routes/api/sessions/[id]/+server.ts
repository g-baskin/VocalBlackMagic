import type { RequestHandler } from './$types';
import { errorResponse } from '../../../../lib/server/errors';
import { disabledResponse, guardMutation } from '../../../../lib/server/gate';
import { svc } from '../../../../lib/server/svc';

export const GET: RequestHandler = async ({ params }) => {
  const blocked = disabledResponse();
  if (blocked) return blocked;
  try {
    return Response.json(await svc().store.read(params.id), {
      headers: { 'cache-control': 'no-store' }
    });
  } catch (error) {
    return errorResponse(error);
  }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
  const blocked = guardMutation(request, { json: false });
  if (blocked) return blocked;
  try {
    await svc().remove(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
};
