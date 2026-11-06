import { existsSync } from 'node:fs';
import type { RequestHandler } from './$types';
import { generationAllowed } from '../../../../lib/server/music/gate';
import { studioContext, noStore } from '../../../../lib/server/studio/context';
import { engineInfos } from '../../../../lib/server/studio/engines';
import { ffmpegPath } from '../../../../lib/server/studio/master';
import { usableVoices } from '../../../../lib/server/studio/voices';

export const GET: RequestHandler = async ({ fetch }) => {
  const ctx = studioContext(fetch);
  const allowed = generationAllowed();
  return Response.json(
    {
      allowed,
      engines: engineInfos({
        replicate: !!ctx.replicate,
        fal: !!ctx.fal,
        gemini: !!ctx.gemini,
        allowed
      }),
      lyrics_ready: allowed && !!ctx.replicate,
      master_ready: allowed && existsSync(ffmpegPath),
      voices_ready: allowed ? (await usableVoices(ctx.library.root)).length : 0
    },
    { headers: noStore }
  );
};
