import { generationAllowed } from '../../../../lib/server/music/gate';
import { studioContext, studioError } from '../../../../lib/server/studio/context';
import { createSongs, lyricistChain } from '../../../../lib/server/studio/create';
import { advanceJob, loadJob } from '../../../../lib/server/studio/jobs';
import { runLyricistChain } from '../../../../lib/server/studio/lyrics';
import { modelInfos } from '../../../../lib/server/studio/runners/capabilities';
import { SeanceRefused, type SeanceDeps } from '../../../../lib/server/studio/seance';

/** Wires the séance to the real studio: createSongs, the job store and live capabilities. */
export function seanceDeps(fetcher: typeof fetch): SeanceDeps {
  const ctx = studioContext(fetcher);
  const chain = lyricistChain(ctx);
  const hasLyricist = !!(chain.anthropic || chain.openai || chain.gemini || chain.replicate);
  return {
    root: ctx.library.root,
    now: ctx.now,
    random: Math.random,
    capabilities: () =>
      modelInfos(
        {
          engine: ctx.direct?.engine ?? null,
          fal: !!ctx.fal,
          minimax: !!ctx.direct?.minimax,
          elevenlabs: !!ctx.direct?.elevenlabs,
          gemini: !!ctx.gemini,
          replicate: !!ctx.replicate
        },
        generationAllowed()
      ),
    writeLyrics: hasLyricist
      ? async (prompt) => {
          const written = await runLyricistChain(chain, {
            action: 'write',
            description: prompt,
            lyrics: '',
            instruction: '',
            max_chars: 560
          });
          return { lyrics: written.lyrics, title: written.title };
        }
      : null,
    create: (request, options) => createSongs(ctx, request, options),
    advance: (id) => advanceJob(ctx, id),
    jobRunner: async (id) => (await loadJob(ctx, id)).plan.runner?.runner ?? null
  };
}

/** studioError, plus the list of refused models so none is silently dropped. */
export function seanceError(error: unknown): Response {
  if (error instanceof SeanceRefused)
    return Response.json({ detail: error.publicMessage, refused: error.refused }, { status: 422 });
  return studioError(error);
}
