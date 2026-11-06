import type { StudioModel, StudioModelInfo } from '@vbm/contracts';
import { modelCosts } from './routed';
import { models } from './models';
import { runnerUnavailable, type HealthCache, type RunnerKeys } from './router';

/** Models x runners with live status (the engine's health is asked once per call). */
export async function modelInfos(keys: RunnerKeys, allowed: boolean): Promise<StudioModelInfo[]> {
  const out: StudioModelInfo[] = [];
  const cache: HealthCache = {};
  for (const model of models) {
    const runners: StudioModelInfo['runners'] = [];
    for (const runner of model.runners) {
      const reason = allowed
        ? await runnerUnavailable(runner, keys, cache)
        : 'disabled outside development';
      runners.push({
        kind: runner.kind,
        model_version: runner.model_version,
        license: runner.license,
        commercial: runner.commercial,
        license_badge: runner.commercial ? runner.license : 'Non-commercial',
        status: reason ?? 'ready'
      });
    }
    out.push({
      id: model.id,
      name: model.name,
      open: model.open,
      vocals: model.vocals,
      instrumental: model.instrumental,
      runners,
      est_cost_usd: modelCosts[model.id as StudioModel] ?? 0,
      active_runner: runners.find((r) => r.status === 'ready')?.kind ?? null
    });
  }
  return out;
}
