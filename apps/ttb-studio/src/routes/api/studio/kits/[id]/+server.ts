import type { RequestHandler } from './$types';
import { guard, noStore, readJson, studioError } from '../../../../../lib/server/studio/context';
import { samplerContext } from '../../../../../lib/server/sampler/context';

export const GET: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json({ kit: await samplerContext().kits.get(params.id) }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const PUT: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = (await readJson(request)) as { kit?: unknown } | undefined;
  try {
    const kit = await samplerContext().kits.save(params.id, body?.kit);
    return Response.json({ kit }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    await samplerContext().kits.remove(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return studioError(error);
  }
};
