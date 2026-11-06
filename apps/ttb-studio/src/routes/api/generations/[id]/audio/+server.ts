import { FAL_KEY } from '$app/env/private';
import type { RequestHandler } from './$types';
import { verifiedAudioResponse } from '../../../../../lib/server/music/audio';
import { errorResponse } from '../../../../../lib/server/music/errors';
import { falAudioUrl, isFalRequestId } from '../../../../../lib/server/music/fal';
import { configuredKey, generationDisabledResponse } from '../../../../../lib/server/music/gate';
import { parseJobId } from '../../../../../lib/server/music/jobs';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const disabled = generationDisabledResponse();
  if (disabled) return disabled;
  const parsed = parseJobId(params.id);
  if (!parsed || parsed.provider !== 'fal' || !isFalRequestId(parsed.requestId))
    return Response.json({ detail: 'Generation audio not found.' }, { status: 404 });
  const apiKey = configuredKey(FAL_KEY);
  if (!apiKey) return Response.json({ detail: 'ACE-Step is not configured. Set FAL_KEY in the server environment.' }, { status: 503 });
  try {
    const url = await falAudioUrl({ apiKey, fetch }, parsed.requestId);
    // The key is never sent to the media host, and redirects are refused so the allow-list cannot be bypassed.
    const upstream = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(120_000) });
    return await verifiedAudioResponse(upstream);
  } catch (failure) { return errorResponse(failure); }
};
