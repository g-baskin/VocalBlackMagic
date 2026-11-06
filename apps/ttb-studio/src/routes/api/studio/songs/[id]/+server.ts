import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../../lib/server/studio/context';

export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    const library = studioContext(fetch).library;
    const song = await library.get(params.id);
    const all = await library.list();
    return Response.json(
      { song, children: all.filter((s) => s.parent_id === song.id) },
      { headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};

export const PATCH: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = (await readJson(request)) as { title?: unknown; favourite?: unknown } | undefined;
  if (
    !body ||
    (body.title !== undefined && typeof body.title !== 'string') ||
    (body.favourite !== undefined && typeof body.favourite !== 'boolean')
  )
    return Response.json(
      { detail: 'Send { title?: string, favourite?: boolean }.' },
      { status: 422 }
    );
  try {
    const song = await studioContext(fetch).library.update(params.id, {
      title: body.title as string | undefined,
      favourite: body.favourite as boolean | undefined
    });
    return Response.json({ song }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    await studioContext(fetch).library.remove(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return studioError(error);
  }
};
