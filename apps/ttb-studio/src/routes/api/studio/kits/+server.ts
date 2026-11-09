import type { RequestHandler } from './$types';
import { guard, noStore, readJson, studioError } from '../../../../lib/server/studio/context';
import { samplerContext } from '../../../../lib/server/sampler/context';

export const GET: RequestHandler = async ({ request }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json({ kits: await samplerContext().kits.list() }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = (await readJson(request)) as { name?: unknown } | undefined;
  if (!body || typeof body.name !== 'string' || body.name.length > 80)
    return Response.json(
      { detail: 'Send { name: string } of at most 80 characters.' },
      { status: 422 }
    );
  try {
    const kit = await samplerContext().kits.create(body.name);
    return Response.json({ kit }, { status: 201, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
