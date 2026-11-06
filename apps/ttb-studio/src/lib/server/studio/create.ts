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
  publicJob,
  recordFinishedJob,
  recordJob,
  storeSong,
  submitReplicateTasks,
  type JobContext,
  type JobTask,
  type SongPlan
} from './jobs';
import { runLyricist } from './lyrics';
import { findVoice, submitVoiceSummon } from './voicesummon';

export interface CreateDeps extends JobContext {
  gemini: { apiKey: string; fetch: typeof fetch } | null;
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

export async function createSongs(
  deps: CreateDeps,
  request: CreateSongRequest
): Promise<CreateResult> {
  const spec = engineSpec(request.engine);
  const voice =
    request.voice_id && !request.instrumental && deps.replicate
      ? await findVoice(deps.library.root, request.voice_id)
      : null;
  if (request.voice_id && !deps.replicate)
    throw new ProviderError(503, 'Singing in a forged voice needs REPLICATE_API_TOKEN.');
  if (spec.needs === 'replicate' && !deps.replicate)
    throw new ProviderError(
      503,
      spec.name.split(' —')[0] + ' needs REPLICATE_API_TOKEN in apps/ttb-studio/.env.'
    );
  if (spec.needs === 'fal' && !deps.fal)
    throw new ProviderError(503, 'ACE-Step via fal needs FAL_KEY.');
  if (spec.needs === 'gemini' && !deps.gemini)
    throw new ProviderError(503, 'Lyria 3.5 needs GEMINI_API_KEY.');

  await assertJobCapacity(deps);
  let lyrics = request.instrumental ? null : request.lyrics?.trim() || null;
  let title = request.title.trim();
  // Lyria 3.5 writes its own lyrics; the other vocal engines need them written first.
  if (!request.instrumental && !lyrics && request.engine !== 'lyria-3.5') {
    if (!deps.replicate)
      throw new ProviderError(
        503,
        'Writing lyrics needs REPLICATE_API_TOKEN. Paste your own lyrics instead.'
      );
    const written = await runLyricist(deps.replicate, {
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
  const invalid = voice ? null : engineRequestError(request, lyrics);
  if (invalid) throw new ProviderError(422, invalid);

  const plan: SongPlan = {
    title,
    prompt: stylePrompt(request),
    style_tags: request.style_tags,
    lyrics,
    engine: request.engine,
    params: {
      mode: request.mode,
      instrumental: request.instrumental,
      duration_seconds: spec.duration ? (request.duration_seconds ?? 120) : null,
      sound_character: request.sound_character,
      lyrics_written_by_ai: !request.lyrics?.trim() && !request.instrumental,
      cover: request.cover !== false && !!deps.replicate
    },
    parent_id: null,
    kind: 'original',
    est_cost_usd:
      spec.est_cost_usd + (request.lyrics?.trim() || request.instrumental ? 0 : derivedCosts.lyrics)
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
    return { job: publicJob(await recordFinishedJob(deps, 'create', plan, ids)), lyrics, title };
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
