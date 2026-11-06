import type { RequestHandler } from './$types';
import { errorResponse } from '../../../../../lib/server/errors';
import { guardMutation, jsonError, readJson } from '../../../../../lib/server/gate';
import { svc } from '../../../../../lib/server/svc';

export const POST: RequestHandler = async ({ params, request }) => {
  const blocked = guardMutation(request, { json: true });
  if (blocked) return blocked;
  const body = await readJson(request);
  if (!body) return jsonError('Body must be a JSON object.', 400);
  try {
    return Response.json(await svc().startForge(params.id, body), { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
};
