import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { LyricSheets } from '../../../../../../lib/server/studio/uploads';

const sheets = (fetcher: typeof fetch) => new LyricSheets(studioContext(fetcher).library.root);

export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json({ sheet: await sheets(fetch).get(params.id) }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    await sheets(fetch).remove(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return studioError(error);
  }
};
