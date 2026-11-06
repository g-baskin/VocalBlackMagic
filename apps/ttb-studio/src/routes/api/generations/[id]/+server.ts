import { FAL_KEY } from '$app/env/private';
import type { RequestHandler } from './$types';
import type { GenerationJob } from '@vbm/contracts';
import { errorResponse } from '../../../../lib/server/music/errors';
import { falStatus, isFalRequestId } from '../../../../lib/server/music/fal';
import { configuredKey, generationDisabledResponse } from '../../../../lib/server/music/gate';
import { falJobId, parseJobId } from '../../../../lib/server/music/jobs';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const disabled = generationDisabledResponse();
  if (disabled) return disabled;
  const parsed = parseJobId(params.id);
  if (parsed?.provider === 'lyria')
    return Response.json({ detail: 'Lyria songs are returned with the original request and are not stored yet.' }, { status: 404 });
  if (!parsed || !isFalRequestId(parsed.requestId)) return Response.json({ detail: 'Generation job not found.' }, { status: 404 });
  const apiKey = configuredKey(FAL_KEY);
  if (!apiKey) return Response.json({ detail: 'ACE-Step is not configured. Set FAL_KEY in the server environment.' }, { status: 503 });
  try {
    const { status, detail } = await falStatus({ apiKey, fetch }, parsed.requestId);
    const jobId = falJobId(parsed.requestId);
    const job: GenerationJob = { job_id: jobId, engine: 'ace-step', status, ...(detail ? { detail } : {}) };
    if (status === 'completed') job.audio_url = '/api/generations/' + encodeURIComponent(jobId) + '/audio';
    return Response.json(job, { headers: { 'cache-control': 'no-store' } });
  } catch (failure) { return errorResponse(failure); }
};
