import type { RequestHandler } from './$types';
import { guard, noStore, readJson, studioError } from '../../../../../lib/server/studio/context';
import { beatStore } from '../../../../../lib/server/beats/projects';

export const GET: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json({ project: await beatStore().get(params.id) }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const PUT: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = (await readJson(request)) as { project?: unknown } | undefined;
  try {
    const project = await beatStore().save(params.id, body?.project);
    return Response.json({ project }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    await beatStore().remove(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return studioError(error);
  }
};
