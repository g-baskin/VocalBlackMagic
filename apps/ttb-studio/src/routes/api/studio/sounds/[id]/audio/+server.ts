import type { RequestHandler } from './$types';
import { guard, studioError } from '../../../../../../lib/server/studio/context';
import { fileResponse } from '../../../../../../lib/server/studio/range';
import { samplerContext } from '../../../../../../lib/server/sampler/context';

export const GET: RequestHandler = async ({ request, params, url }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    const { file, size, meta } = await samplerContext().sounds.audioFile(params.id);
    const download = url.searchParams.get('download') === '1' ? meta.name + '.wav' : undefined;
    return fileResponse(file, size, 'audio/wav', request.headers.get('range'), download);
  } catch (error) {
    return studioError(error);
  }
};
