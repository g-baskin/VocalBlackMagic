import type { CreateSongRequest, StudioModel, StudioRunnerRecord } from '@vbm/contracts';
import { ProviderError } from '../../music/errors';
import { submitFal } from '../../music/fal';
import { createPrediction, type ReplicateDeps } from '../replicate';
import type { FalDeps } from '../../music/fal';
import type { JobTask } from '../jobs';
import {
  elevenlabsGenerate,
  lyria3ProGenerate,
  minimaxGenerate,
  type DirectResult
} from './direct';
import { RunnerRefused, submitEngineJob, type EngineDeps } from './engine';
import { modelSpec, type ModelInput, type ModelSpec, type RunnerSpec } from './models';
import { replicateRefusal, route, type RunnerAttempt, type RunnerKeys } from './router';

export interface RoutedDeps {
  engine: EngineDeps | null;
  fal: FalDeps | null;
  replicate: ReplicateDeps | null;
  gemini: { apiKey: string; fetch: typeof fetch } | null;
  minimax: string | null;
  elevenlabs: string | null;
  fetch: typeof fetch;
}

/** Either queued provider tasks (polled by advanceJob) or audio that came back synchronously. */
export type Submitted = { tasks: JobTask[] } | { results: DirectResult[] };

export interface RoutedSubmission {
  submitted: Submitted;
  record: StudioRunnerRecord;
}

/** Rough per-song estimates for meta.json (no billing guarantee). */
export const modelCosts: Record<StudioModel, number> = {
  'ace-step-1.5': 0.05,
  heartmula: 0.1,
  diffrhythm: 0.05,
  yue: 0.3,
  'minimax-music-2.6': 0.15,
  'lyria-3-pro': 0.08,
  'elevenlabs-music': 0.5
};

export function routedKeys(deps: RoutedDeps): RunnerKeys {
  return {
    engine: deps.engine,
    fal: !!deps.fal,
    minimax: !!deps.minimax,
    elevenlabs: !!deps.elevenlabs,
    gemini: !!deps.gemini,
    replicate: !!deps.replicate
  };
}

/** Request-level checks against the model itself (runner limits are enforced by each runner). */
export function modelRequestError(model: ModelSpec, request: CreateSongRequest): string | null {
  if (request.instrumental && !model.instrumental)
    return model.name + ' cannot make instrumentals. Pick another model.';
  if (!request.instrumental && !model.vocals)
    return model.name + ' makes instrumentals only. Turn on Instrumental.';
  return null;
}

/** One take on one runner. Throws RunnerRefused only when nothing was created. */
async function submitOne(
  deps: RoutedDeps,
  runner: RunnerSpec,
  input: ModelInput,
  take: number
): Promise<JobTask | DirectResult> {
  switch (runner.kind) {
    case 'engine': {
      const job = await submitEngineJob(
        deps.engine!,
        {
          model: runner.engine_model!,
          task: 'text2music',
          prompt: input.prompt.slice(0, 2000),
          ...(input.instrumental ? { instrumental: true } : { lyrics: input.lyrics ?? '' }),
          duration_seconds: input.duration_seconds
        },
        crypto.randomUUID()
      );
      return { provider: 'engine', prediction_id: job.id, take, status: 'running' };
    }
    case 'fal': {
      try {
        const id = await submitFal(
          deps.fal!,
          {
            prompt: input.prompt,
            lyrics: input.lyrics,
            mode: input.instrumental ? 'instrumental' : 'full-song',
            engine: 'ace-step',
            sound_character: 'custom',
            premium_studio: false,
            texture: 50,
            human_variation: 50,
            mastering_intensity: 0,
            duration_seconds: Math.round(input.duration_seconds)
          },
          input.lyrics
        );
        return { provider: 'fal', prediction_id: id, take, status: 'running' };
      } catch (error) {
        // An HTTP refusal at submit means fal queued nothing.
        if (error instanceof ProviderError && error.logDetail?.startsWith('fal submit failed'))
          throw new RunnerRefused(error.status, error.publicMessage, error.logDetail);
        throw error;
      }
    }
    case 'replicate': {
      try {
        const prediction = await createPrediction(
          deps.replicate!,
          runner.replicate!,
          runner.input!(input)
        );
        return { provider: 'replicate', prediction_id: prediction.id, take, status: 'running' };
      } catch (error) {
        throw replicateRefusal(error);
      }
    }
    case 'minimax':
      return minimaxGenerate({ apiKey: deps.minimax!, fetch: deps.fetch }, input);
    case 'elevenlabs':
      return elevenlabsGenerate({ apiKey: deps.elevenlabs!, fetch: deps.fetch }, input);
    case 'gemini':
      return lyria3ProGenerate(deps.gemini!, input);
  }
}

/**
 * Routes the first take (falling back only on create-time refusals), then runs any further takes
 * on the same runner. A later take that fails keeps the takes already accepted.
 */
export async function submitRouted(
  deps: RoutedDeps,
  modelId: StudioModel,
  input: ModelInput,
  takes: number
): Promise<RoutedSubmission> {
  const model = modelSpec(modelId);
  if (!model) throw new ProviderError(422, 'Unknown model.');
  const routed = await route(model, routedKeys(deps), (runner) =>
    submitOne(deps, runner, input, 1)
  );
  const first = routed.result;
  const items: (JobTask | DirectResult)[] = [first];
  const attempts: RunnerAttempt[] = routed.attempts;
  for (let take = 2; take <= takes; take += 1) {
    try {
      items.push(await submitOne(deps, routed.runner, input, take));
    } catch (error) {
      attempts.push({
        runner: routed.runner.kind,
        model_version: routed.runner.model_version,
        outcome:
          'take ' +
          take +
          ' failed: ' +
          (error instanceof ProviderError ? error.publicMessage : 'error')
      });
      break;
    }
  }
  const record: StudioRunnerRecord = {
    model: modelId,
    runner: routed.runner.kind,
    model_version: routed.runner.model_version,
    license: routed.runner.license,
    commercial: routed.runner.commercial,
    attempts
  };
  const submitted: Submitted =
    'audio' in first ? { results: items as DirectResult[] } : { tasks: items as JobTask[] };
  return { submitted, record };
}
