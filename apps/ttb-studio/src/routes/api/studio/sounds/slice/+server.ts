import { validateSliceRequest, type SliceRequest } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import { guard, noStore, readJson, studioError } from '../../../../../lib/server/studio/context';
import { samplerContext } from '../../../../../lib/server/sampler/context';
import { sliceSounds } from '../../../../../lib/server/sampler/slice';

export const POST: RequestHandler = async ({ request }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = await readJson(request);
  const invalid = validateSliceRequest(body);
  if (invalid) return Response.json({ detail: invalid }, { status: 422 });
  try {
    const sounds = await sliceSounds(samplerContext(), body as SliceRequest);
    return Response.json({ sounds }, { status: 201, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
