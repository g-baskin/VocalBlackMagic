import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../../../lib/server/studio/context';
import { startVoice } from '../../../../../../lib/server/studio/derive';
import { usableVoices } from '../../../../../../lib/server/studio/voices';

export const POST: RequestHandler = async ({ request, params, fetch }) => {
  const blocked = guard(request, true);
  if (blocked) return blocked;
  const body = ((await readJson(request)) ?? {}) as { voice_id?: unknown };
  const ctx = studioContext(fetch);
  const voice = (await usableVoices(ctx.library.root)).find((v) => v.id === body.voice_id);
  if (!voice)
    return Response.json(
      { detail: 'Choose a ready voice with own-voice consent from Voice training.' },
      { status: 422 }
    );
  try {
    return Response.json(
      { job: await startVoice(ctx, params.id, voice) },
      { status: 202, headers: noStore }
    );
  } catch (error) {
    return studioError(error);
  }
};
