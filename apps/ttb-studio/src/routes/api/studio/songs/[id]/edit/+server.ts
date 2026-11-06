import { validateEditRequest, type EditRequest } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { editInfos, startEdit } from '../../../../../../lib/server/studio/edit';

/** Which edits this song can have now, and why not. */
export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    const ctx = studioContext(fetch);
    const song = await ctx.library.get(params.id);
    return Response.json({ edits: await editInfos(ctx, song) }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

/** Starts an extend, replace-section or restyle job; the result is a new song. */
export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = await readJson(request);
  // The range is checked against the measured song length inside startEdit.
  const invalid = validateEditRequest(body, null);
  if (invalid) return Response.json({ detail: invalid }, { status: 422 });
  try {
    const job = await startEdit(studioContext(fetch), params.id, body as EditRequest);
    return Response.json({ job }, { status: 202, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
