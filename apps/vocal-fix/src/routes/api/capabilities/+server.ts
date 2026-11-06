import type { RequestHandler } from './$types';
import { passthrough, upstreamUnavailable, upstreamUrl } from '../../../lib/server/backend';
export const GET: RequestHandler = async ({ fetch }) => {
  try {
    const result = await fetch(upstreamUrl('VOCAL_FIX_API_URL', 'http://127.0.0.1:8001', '/api/capabilities'), {
      signal: AbortSignal.timeout(3000), cache: 'no-store'
    });
    return passthrough(result);
  } catch (error) { return upstreamUnavailable(error); }
};
