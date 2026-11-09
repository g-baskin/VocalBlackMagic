import { soundCategories, type SoundCategory } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import { guard, noStore, readJson, studioError } from '../../../../../lib/server/studio/context';
import { samplerContext } from '../../../../../lib/server/sampler/context';
import { cleanTags } from '../../../../../lib/server/sampler/sounds';

export const GET: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json(
      { sound: await samplerContext().sounds.get(params.id) },
      { headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};

export const PATCH: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = (await readJson(request)) as Record<string, unknown> | undefined;
  const tags = body?.tags === undefined ? undefined : cleanTags(body.tags);
  if (
    !body ||
    typeof body !== 'object' ||
    (body.name !== undefined && typeof body.name !== 'string') ||
    (body.favourite !== undefined && typeof body.favourite !== 'boolean') ||
    (body.category !== undefined &&
      !(soundCategories as readonly unknown[]).includes(body.category)) ||
    tags === null
  )
    return Response.json(
      {
        detail:
          'Send { name?: string, favourite?: boolean, category?: string, tags?: up to 12 short words }.'
      },
      { status: 422 }
    );
  try {
    const sound = await samplerContext().sounds.update(params.id, {
      name: body.name as string | undefined,
      favourite: body.favourite as boolean | undefined,
      category: body.category as SoundCategory | undefined,
      tags
    });
    return Response.json({ sound }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    await samplerContext().sounds.remove(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return studioError(error);
  }
};
