import { existsSync } from 'node:fs';
import type { RequestHandler } from './$types';
import { generationAllowed } from '../../../../lib/server/music/gate';
import { studioContext, noStore } from '../../../../lib/server/studio/context';
import { engineInfos } from '../../../../lib/server/studio/engines';
import { ffmpegPath } from '../../../../lib/server/studio/master';
import { modelInfos } from '../../../../lib/server/studio/runners/capabilities';
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
      models: await modelInfos(
        {
          engine: ctx.direct?.engine ?? null,
          fal: !!ctx.fal,
          minimax: !!ctx.direct?.minimax,
          elevenlabs: !!ctx.direct?.elevenlabs,
          gemini: !!ctx.gemini,
          replicate: !!ctx.replicate
        },
        allowed
      ),
      lyrics_ready:
        allowed && !!(ctx.replicate || ctx.gemini || ctx.direct?.anthropic || ctx.direct?.openai),
      master_ready: allowed && existsSync(ffmpegPath),
      voices_ready: allowed ? (await usableVoices(ctx.library.root)).length : 0
    },
    { headers: noStore }
  );
};
