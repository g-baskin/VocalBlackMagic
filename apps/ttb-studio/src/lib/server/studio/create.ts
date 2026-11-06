import type { CreateSongRequest, GenerationRequest, SongMeta, StudioJob } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { submitFal } from '../music/fal';
import { generateLyria } from '../music/lyria';
import {
  engineRequestError,
  engineSpec,
  replicateInput,
  replicateModels,
  stylePrompt,
  derivedCosts
} from './engines';
import {
  assertJobCapacity,
  maybeCover,
  maxActiveJobs,
  seanceMaxActiveJobs,
  publicJob,
  recordFinishedJob,
  recordJob,
  storeSong,
  submitReplicateTasks,
  type JobContext,
  type JobTask,
  type SongPlan
} from './jobs';
import { modelSpec } from './runners/models';
import { modelCosts, modelRequestError, submitRouted } from './runners/routed';
import { runLyricistChain, type LyricistChain } from './lyrics';
import type { EngineDeps } from './runners/engine';
import { findVoice, submitVoiceSummon } from './voicesummon';

export interface CreateDeps extends JobContext {
  gemini: { apiKey: string; fetch: typeof fetch } | null;
  /** Direct providers and the self-hosted engine; absent in older tests means none configured. */
  direct?: DirectKeys;
}

export interface DirectKeys {
  anthropic: string | null;
  openai: string | null;
  minimax: string | null;
  elevenlabs: string | null;
  engine: EngineDeps | null;
}

export function lyricistChain(deps: CreateDeps): LyricistChain {
  return {
    anthropic: deps.direct?.anthropic ?? null,
    openai: deps.direct?.openai ?? null,
    gemini: deps.gemini?.apiKey ?? null,
    replicate: deps.replicate,
    fetch: deps.fetch
  };
}

export interface CreateResult {
  job: StudioJob;
  lyrics: string | null;
  title: string;
}

function fallbackTitle(prompt: string): string {
  const words = prompt
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join(' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Untitled spell';
}

/** Maps a studio request onto the legacy GenerationRequest used by the fal and Lyria 3.5 adapters. */
export function legacyRequest(
  request: CreateSongRequest,
  lyrics: string | null
): GenerationRequest {
  return {
    prompt: [
      request.prompt.trim(),
      request.style_tags.length ? 'Style: ' + request.style_tags.join(', ') + '.' : ''
    ]
      .filter(Boolean)
      .join(' '),
    lyrics,
    mode: request.instrumental ? 'instrumental' : 'full-song',
    engine: request.engine === 'lyria-3.5' ? 'lyria-3.5' : 'ace-step',
    sound_character: request.sound_character,
    premium_studio: false,
    texture: 50,
    human_variation: 50,
    mastering_intensity: 0,
    duration_seconds: request.duration_seconds ?? 120
  };
}

export interface CreateOptions {
  /** Set only by the séance: tags the takes and allows up to 4 active jobs instead of 3. */
  seanceId?: string;
}

export async function createSongs(
  deps: CreateDeps,
  request: CreateSongRequest,
  options: CreateOptions = {}
): Promise<CreateResult> {
  const spec = engineSpec(request.engine);
  const model = request.model ? modelSpec(request.model) : undefined;
  if (request.model && !model) throw new ProviderError(422, 'Unknown model.');
  const voice =
    request.voice_id && !request.instrumental && deps.replicate
      ? await findVoice(deps.library.root, request.voice_id)
      : null;
  if (request.voice_id && !deps.replicate)
    throw new ProviderError(503, 'Singing in a forged voice needs REPLICATE_API_TOKEN.');
  if (!model && spec.needs === 'replicate' && !deps.replicate)
    throw new ProviderError(
      503,
      spec.name.split(' —')[0] + ' needs REPLICATE_API_TOKEN in apps/ttb-studio/.env.'
    );
  if (!model && spec.needs === 'fal' && !deps.fal)
    throw new ProviderError(503, 'ACE-Step via fal needs FAL_KEY.');
  if (!model && spec.needs === 'gemini' && !deps.gemini)
    throw new ProviderError(503, 'Lyria 3.5 needs GEMINI_API_KEY.');

  await assertJobCapacity(deps, options.seanceId ? seanceMaxActiveJobs : maxActiveJobs);
  let lyrics = request.instrumental ? null : request.lyrics?.trim() || null;
  let title = request.title.trim();
  // Lyria 3.5 writes its own lyrics; the other vocal engines need them written first.
  const writesOwnLyrics = model ? model.id === 'lyria-3-pro' : request.engine === 'lyria-3.5';
  if (!request.instrumental && !lyrics && !writesOwnLyrics) {
    const chain = lyricistChain(deps);
    if (!chain.anthropic && !chain.openai && !chain.gemini && !chain.replicate)
      throw new ProviderError(
        503,
        'Writing lyrics needs ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY or REPLICATE_API_TOKEN. Paste your own lyrics instead.'
      );
    const written = await runLyricistChain(chain, {
      action: 'write',
      description:
        request.prompt +
        (request.style_tags.length ? '\nStyle: ' + request.style_tags.join(', ') : ''),
      lyrics: '',
      instruction: '',
      max_chars: request.voice_id
        ? 380
        : Math.min(spec.max_lyrics ?? 2000, request.engine === 'minimax-music-1.5' ? 560 : 2000)
    });
    lyrics = written.lyrics;
    if (!title && written.title) title = written.title;
  }
  if (!title) title = fallbackTitle(request.prompt);
  const invalid = voice
    ? null
    : model
      ? modelRequestError(model, request)
      : engineRequestError(request, lyrics);
  if (invalid) throw new ProviderError(422, invalid);

  const plan: SongPlan = {
    title,
    prompt: stylePrompt(request),
    style_tags: request.style_tags,
    lyrics,
    engine: request.model ?? request.engine,
    params: {
      mode: request.mode,
      instrumental: request.instrumental,
      duration_seconds: model || spec.duration ? (request.duration_seconds ?? 120) : null,
      sound_character: request.sound_character,
      lyrics_written_by_ai: !request.lyrics?.trim() && !request.instrumental,
      cover: request.cover !== false && !!deps.replicate
    },
    parent_id: null,
    kind: 'original',
    ...(options.seanceId ? { seance_id: options.seanceId } : {}),
    est_cost_usd:
      (request.model ? modelCosts[request.model] : spec.est_cost_usd) +
      (request.lyrics?.trim() || request.instrumental ? 0 : derivedCosts.lyrics)
  };
  const takes = Array.from({ length: request.takes }, (_, i) => i);

  if (voice && deps.replicate && lyrics) {
    const summon = await submitVoiceSummon(deps, deps.replicate, request, voice, lyrics, plan);
    return {
      job: publicJob(await recordJob(deps, 'create', summon.plan, summon.tasks)),
      lyrics: summon.plan.lyrics,
      title
    };
  }
  if (request.model) {
    const { submitted, record } = await submitRouted(
      {
        engine: deps.direct?.engine ?? null,
        fal: deps.fal,
        replicate: deps.replicate,
        gemini: deps.gemini,
        minimax: deps.direct?.minimax ?? null,
        elevenlabs: deps.direct?.elevenlabs ?? null,
        fetch: deps.fetch
      },
      request.model,
      {
        prompt: plan.prompt,
        lyrics,
        instrumental: request.instrumental,
        duration_seconds: request.duration_seconds ?? 120
      },
      request.takes
    );
    const routedPlan: SongPlan = {
      ...plan,
      runner: record,
      params: { ...plan.params, runner: record.runner, model_version: record.model_version }
    };
    if ('tasks' in submitted)
      return {
        job: publicJob(await recordJob(deps, 'create', routedPlan, submitted.tasks)),
        lyrics,
        title
      };
    const ids: string[] = [];
    for (const [i, result] of submitted.results.entries())
      ids.push(
        (
          await storeSong(
            deps,
            { ...routedPlan, lyrics: result.lyrics ?? lyrics },
            i + 1,
            result.audio
          )
        ).id
      );
    const finished = await recordFinishedJob(deps, 'create', routedPlan, ids);
    // Synchronous runners (MiniMax, ElevenLabs, Lyria 3 Pro direct) never pass through advanceJob.
    for (const songId of ids) await maybeCover(deps, finished, songId);
    return {
      job: publicJob(finished),
      lyrics,
      title
    };
  }
  if (request.engine === 'lyria-3.5' && deps.gemini) {
    const ids: string[] = [];
    for (const take of takes) {
      const result = await generateLyria(deps.gemini, legacyRequest(request, lyrics));
      const bytes = Uint8Array.from(atob(result.audio.data_base64), (c) => c.charCodeAt(0));
      const response = new Response(bytes, {
        headers: { 'content-type': result.audio.content_type }
      });
      const meta: SongMeta = await storeSong(
        deps,
        { ...plan, lyrics: result.lyrics ?? lyrics },
        take + 1,
        response
      );
      ids.push(meta.id);
    }
    const finished = await recordFinishedJob(deps, 'create', plan, ids);
    for (const songId of ids) await maybeCover(deps, finished, songId);
    return { job: publicJob(finished), lyrics, title };
  }
  let tasks: JobTask[];
  if (request.engine === 'fal-ace-step' && deps.fal) {
    tasks = [];
    for (const take of takes) {
      const id = await submitFal(deps.fal, legacyRequest(request, lyrics), lyrics);
      tasks.push({ provider: 'fal', prediction_id: id, take: take + 1, status: 'running' });
    }
  } else {
    if (!deps.replicate) throw new ProviderError(503, 'REPLICATE_API_TOKEN is not configured.');
    const model = replicateModels[request.engine as keyof typeof replicateModels];
    tasks = await submitReplicateTasks(
      deps.replicate,
      model,
      takes.map(() => replicateInput(request, lyrics))
    );
  }
  return { job: publicJob(await recordJob(deps, 'create', plan, tasks)), lyrics, title };
}
