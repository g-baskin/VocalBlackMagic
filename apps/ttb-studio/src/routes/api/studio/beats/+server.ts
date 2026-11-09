import type { RequestHandler } from './$types';
import { guard, noStore, readJson, studioError } from '../../../../lib/server/studio/context';
import { beatStore } from '../../../../lib/server/beats/projects';

export const GET: RequestHandler = async ({ request }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  try {
    return Response.json({ projects: await beatStore().list() }, { headers: noStore });
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
    const project = await beatStore().create(body.name);
    return Response.json({ project }, { status: 201, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
