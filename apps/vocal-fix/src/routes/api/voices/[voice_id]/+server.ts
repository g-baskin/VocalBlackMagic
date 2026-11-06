import type { RequestHandler } from './$types';
import { errorResponse } from '../../../../lib/server/errors';
import { guardMutation } from '../../../../lib/server/gate';
import { svc } from '../../../../lib/server/svc';

export const DELETE: RequestHandler = async ({ params, request }) => {
  const blocked = guardMutation(request, { json: false });
  if (blocked) return blocked;
  try {
    await svc().revokeVoice(params.voice_id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
};
