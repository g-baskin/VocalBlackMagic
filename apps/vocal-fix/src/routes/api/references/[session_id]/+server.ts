import type { RequestHandler } from './$types';
import { passthrough, upstreamUnavailable, upstreamUrl } from '../../../../lib/server/backend';
function safePath(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
}
export const GET: RequestHandler = async ({ params, fetch }) => {
  if (process.env.NODE_ENV !== 'development') return Response.json({ detail: 'Authentication required.' }, { status: 403 });
  if (!safePath(params.session_id)) return Response.json({ detail: 'Invalid session id.' }, { status: 404 });
  try { return passthrough(await fetch(upstreamUrl('VOCAL_FIX_API_URL','http://127.0.0.1:8001', '/api/references/' + params.session_id), { cache: 'no-store' })); }
  catch (error) { return upstreamUnavailable(error); }
};
export const DELETE: RequestHandler = async ({ params, fetch }) => {
  if (process.env.NODE_ENV !== 'development') return Response.json({ detail: 'Authentication required.' }, { status: 403 });
  if (!safePath(params.session_id)) return Response.json({ detail: 'Invalid session id.' }, { status: 404 });
  try { return passthrough(await fetch(upstreamUrl('VOCAL_FIX_API_URL','http://127.0.0.1:8001', '/api/references/' + params.session_id), { method: 'DELETE' })); }
  catch (error) { return upstreamUnavailable(error); }
};
