import type { RequestHandler } from './$types';
import { noStore, studioError } from '../../../../../lib/server/studio/context';
import { uploadGuard } from '../../../../../lib/server/studio/uploads';
import { samplerContext } from '../../../../../lib/server/sampler/context';
import { readBody, storeUpload, uploadFields } from '../../../../../lib/server/sampler/upload';

export const POST: RequestHandler = async ({ request, url }) => {
  const blocked = uploadGuard(request);
  if (blocked) return blocked;
  const fields = uploadFields(request, url);
  if (typeof fields === 'string') return Response.json({ detail: fields }, { status: 422 });
  try {
    const bytes = await readBody(request);
    const sound = await storeUpload(samplerContext().sounds, fields, bytes);
    return Response.json({ sound }, { status: 201, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
