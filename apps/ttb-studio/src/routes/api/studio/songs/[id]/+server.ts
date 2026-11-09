import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../../lib/server/studio/context';
import { sealSongs } from '../../../../../lib/server/studio/seal';

export const GET: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    const library = studioContext(fetch).library;
    const [song] = await sealSongs(library.root, [await library.get(params.id)]);
    const all = await library.list();
    const children = await sealSongs(
      library.root,
      all.filter((s) => s.parent_id === song.id)
    );
    return Response.json({ song, children }, { headers: noStore });
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
    const library = studioContext(fetch).library;
    const [song] = await sealSongs(library.root, [
      await library.update(params.id, {
        title: body.title as string | undefined,
        favourite: body.favourite as boolean | undefined
      })
    ]);
    return Response.json({ song }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const DELETE: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  // Do not report a local-only deletion as durable while cloud deletion is paused.
  if (process.env.VBM_OWNER_MODE === '1')
    return Response.json(
      { detail: 'Song deletion is temporarily disabled while library storage is being repaired.' },
      { status: 503, headers: noStore }
    );
  try {
    await studioContext(fetch).library.remove(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return studioError(error);
  }
};
