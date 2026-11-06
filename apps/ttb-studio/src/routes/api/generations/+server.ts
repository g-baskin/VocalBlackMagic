import { FAL_KEY, GEMINI_API_KEY } from '$app/env/private';
import type { RequestHandler } from './$types';
import { validateGenerationRequest, type GenerationJob, type GenerationRequest } from '@vbm/contracts';
import { errorResponse } from '../../../lib/server/music/errors';
import { submitFal } from '../../../lib/server/music/fal';
import { configuredKey, generationDisabledResponse, isJsonRequest } from '../../../lib/server/music/gate';
import { falJobId } from '../../../lib/server/music/jobs';
import { generateLyria } from '../../../lib/server/music/lyria';

const noStore = { 'cache-control': 'no-store' };

export const POST: RequestHandler = async ({ request, fetch }) => {
  const disabled = generationDisabledResponse();
  if (disabled) return disabled;
  if (!isJsonRequest(request)) return Response.json({ detail: 'Send the song request as application/json.' }, { status: 415 });
  let payload: GenerationRequest;
  try { payload = await request.json(); }
  catch { return Response.json({ detail: 'Invalid JSON body.' }, { status: 400 }); }
  if (!payload || typeof payload.prompt !== 'string' || typeof payload.premium_studio !== 'boolean'
     || typeof payload.texture !== 'number' || typeof payload.human_variation !== 'number'
     || typeof payload.mastering_intensity !== 'number' || typeof payload.duration_seconds !== 'number'
     || (payload.lyrics !== null && typeof payload.lyrics !== 'string')) {
    return Response.json({ detail: 'Invalid song generation request.' }, { status: 422 });
  }
  const error = validateGenerationRequest(payload);
  if (error) return Response.json({ detail: error }, { status: 422 });

  try {
    if (payload.engine === 'ace-step') {
      const apiKey = configuredKey(FAL_KEY);
      if (!apiKey) return Response.json({ detail: 'ACE-Step is not configured. Set FAL_KEY in the server environment.' }, { status: 503 });
      const requestId = await submitFal({ apiKey, fetch }, payload);
      const job: GenerationJob = { job_id: falJobId(requestId), engine: 'ace-step', status: 'queued' };
      return Response.json(job, { status: 202, headers: noStore });
    }
    if (payload.engine === 'lyria-3.5') {
      const apiKey = configuredKey(GEMINI_API_KEY);
      if (!apiKey) return Response.json({ detail: 'Lyria 3.5 is not configured. Set GEMINI_API_KEY in the server environment.' }, { status: 503 });
      const { audio, lyrics } = await generateLyria({ apiKey, fetch }, payload);
      const job: GenerationJob = { job_id: 'lyria.' + crypto.randomUUID(), engine: 'lyria-3.5', status: 'completed', audio, lyrics };
      return Response.json(job, { status: 200, headers: noStore });
    }
    return Response.json({ detail: 'This engine is not implemented yet.' }, { status: 501 });
  } catch (failure) { return errorResponse(failure); }
};
