import type { RequestHandler } from './$types';
import { validateGenerationRequest, type GenerationRequest } from '@vbm/contracts';
import { passthrough, upstreamUnavailable, upstreamUrl } from '../../../lib/server/backend';
export const POST: RequestHandler = async ({ request, fetch }) => {
  // No paid jobs, user identity, or tenant authorization yet: deny production.
  if (process.env.NODE_ENV !== 'development')
    return Response.json({ detail: 'Song generation is disabled pending authentication, billing and engine setup.' }, { status: 403 });
  let payload: GenerationRequest;
  try { payload = await request.json(); }
  catch { return Response.json({ detail: 'Invalid JSON body.' }, { status: 400 }); }
  if (!payload || typeof payload.prompt !== 'string' || typeof payload.premium_studio !== 'boolean'
     || typeof payload.texture !== 'number' || typeof payload.human_variation !== 'number'
     || typeof payload.mastering_intensity !== 'number'
     || (payload.lyrics !== null && typeof payload.lyrics !== 'string')) {
    return Response.json({ detail: 'Invalid song generation request.' }, { status: 422 });
  }
  const error = validateGenerationRequest(payload);
  if (error) return Response.json({ detail: error }, { status: 422 });
  try {
    const response = await fetch(upstreamUrl('/api/generations'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000)
    });
    return passthrough(response);
  } catch (error) { return upstreamUnavailable(error); }
};
