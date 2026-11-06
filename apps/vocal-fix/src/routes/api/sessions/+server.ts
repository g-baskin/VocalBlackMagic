import type { RequestHandler } from './$types';
import { errorResponse } from '../../../lib/server/errors';
import { guardMutation, jsonError, readCapped } from '../../../lib/server/gate';
import { MAX_UPLOAD_BYTES } from '../../../lib/server/media';
import { svc } from '../../../lib/server/svc';

export const POST: RequestHandler = async ({ request }) => {
  const blocked = guardMutation(request, { json: false });
  if (blocked) return blocked;
  const body = await readCapped(request, 5 * MAX_UPLOAD_BYTES + 1024 * 1024);
  if (!body) return jsonError('Upload too large.', 413);
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(body), {
      headers: { 'content-type': request.headers.get('content-type') ?? '' }
    }).formData();
  } catch {
    return jsonError('Invalid multipart form.', 400);
  }
  const items = form.getAll('files');
  if (items.some((f) => !(f instanceof File))) return jsonError('files must be audio files.', 422);
  try {
    const files = await Promise.all(
      (items as File[]).map(async (f) => ({
        name: f.name,
        bytes: new Uint8Array(await f.arrayBuffer())
      }))
    );
    const manifest = await svc().intake({
      mode: form.get('mode'),
      performer: form.get('performer'),
      acknowledged_rights: form.get('acknowledged_rights') === 'true',
      files
    });
    return Response.json(manifest, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
};
