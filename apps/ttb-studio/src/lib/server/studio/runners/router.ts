import { ProviderError } from '../../music/errors';
import { engineHealth, engineModelReason, RunnerRefused, type EngineDeps } from './engine';
import { runnerKeys, type ModelSpec, type RunnerKind, type RunnerSpec } from './models';

/** Which runners have credentials; the engine also needs its health to say the model is ready. */
export interface RunnerKeys {
  engine: EngineDeps | null;
  fal: boolean;
  minimax: boolean;
  elevenlabs: boolean;
  gemini: boolean;
  replicate: boolean;
}

export interface RunnerAttempt {
  runner: RunnerKind;
  model_version: string;
  /** 'submitted' for the runner that took the job, otherwise why it was skipped or refused. */
  outcome: string;
}

/** Plain reason a runner cannot take this model right now, or null when it can. */
export async function runnerUnavailable(
  runner: RunnerSpec,
  keys: RunnerKeys
): Promise<string | null> {
  if (runner.pending) return runner.pending;
  if (runner.kind === 'engine') {
    if (!keys.engine) return 'needs ' + runnerKeys.engine;
    try {
      return engineModelReason(await engineHealth(keys.engine), runner.engine_model!);
    } catch (error) {
      return error instanceof ProviderError ? error.publicMessage : 'engine unreachable';
    }
  }
  return keys[runner.kind] ? null : 'needs ' + runnerKeys[runner.kind];
}

export interface Routed<T> {
  result: T;
  runner: RunnerSpec;
  attempts: RunnerAttempt[];
}

/** Thrown when no runner took the job; carries every attempt for the job record. */
export class NoRunner extends ProviderError {
  constructor(
    readonly attempts: RunnerAttempt[],
    status = 503
  ) {
    super(
      status,
      'No runner could take this model: ' +
        attempts.map((a) => a.runner + ' (' + a.outcome + ')').join('; ')
    );
    this.name = 'NoRunner';
  }
}

/**
 * Tries runners in preference order. Falls back ONLY when a runner was unavailable or refused at
 * create time (RunnerRefused). Any other failure may mean a job was accepted, so it is rethrown
 * as-is and never retried elsewhere (no double payment).
 */
export async function route<T>(
  model: ModelSpec,
  keys: RunnerKeys,
  submit: (runner: RunnerSpec) => Promise<T>,
  only?: RunnerKind
): Promise<Routed<T>> {
  const attempts: RunnerAttempt[] = [];
  let lastStatus = 503;
  for (const runner of model.runners) {
    if (only && runner.kind !== only) continue;
    const reason = await runnerUnavailable(runner, keys);
    if (reason) {
      attempts.push({ runner: runner.kind, model_version: runner.model_version, outcome: reason });
      continue;
    }
    try {
      const result = await submit(runner);
      attempts.push({
        runner: runner.kind,
        model_version: runner.model_version,
        outcome: 'submitted'
      });
      return { result, runner, attempts };
    } catch (error) {
      if (!(error instanceof RunnerRefused)) throw error;
      lastStatus = error.status;
      attempts.push({
        runner: runner.kind,
        model_version: runner.model_version,
        outcome: 'refused: ' + error.publicMessage
      });
    }
  }
  throw new NoRunner(
    attempts,
    attempts.some((a) => a.outcome.startsWith('refused')) ? lastStatus : 503
  );
}

/**
 * Converts a Replicate create-time HTTP refusal (no prediction was created) into RunnerRefused.
 * Network errors, timeouts and malformed success bodies stay as they are: a job may exist.
 */
export function replicateRefusal(error: unknown): unknown {
  if (
    error instanceof ProviderError &&
    (error.logDetail?.startsWith('replicate create failed') ||
      (error.status === 429 && !error.logDetail))
  )
    return new RunnerRefused(error.status, error.publicMessage, error.logDetail);
  return error;
}
