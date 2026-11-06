import { describe, expect, test } from 'bun:test';
import { ProviderError } from '../../music/errors';
import { RunnerRefused } from './engine';
import { modelSpec, models } from './models';
import { NoRunner, replicateRefusal, route, type RunnerKeys } from './router';

const keys: RunnerKeys = {
  engine: null,
  fal: false,
  minimax: false,
  elevenlabs: false,
  gemini: false,
  replicate: true
};
const input = {
  prompt: 'dark pop',
  lyrics: '[Verse]\nhi',
  instrumental: false,
  duration_seconds: 120
};

describe('models x runners router', () => {
  test('every model lists runners with licence and exact version; replicate ones build input', () => {
    for (const model of models) {
      expect(model.runners.length).toBeGreaterThan(0);
      for (const r of model.runners) {
        expect(r.license).toBeTruthy();
        expect(r.model_version).toBeTruthy();
        if (r.kind === 'replicate') expect(Object.keys(r.input!(input)).length).toBeGreaterThan(0);
      }
    }
    expect(modelSpec('yue')!.runners[0].commercial).toBe(false);
    expect(modelSpec('diffrhythm')!.runners[1].model_version).toContain('v1');
  });

  test('skips runners without keys and records why', async () => {
    const routed = await route(modelSpec('ace-step-1.5')!, keys, async (r) => r.kind);
    expect(routed.result).toBe('replicate');
    expect(routed.attempts.map((a) => a.outcome)).toEqual([
      'needs VBM_ENGINE_URL and VBM_ENGINE_TOKEN',
      'needs FAL_KEY',
      'submitted'
    ]);
  });

  test('falls back after a create-time refusal only', async () => {
    const withFal = { ...keys, fal: true };
    const routed = await route(modelSpec('ace-step-1.5')!, withFal, async (r) => {
      if (r.kind === 'fal') throw new RunnerRefused(402, 'no credit');
      return r.kind;
    });
    expect(routed.result).toBe('replicate');
    expect(routed.attempts[1].outcome).toBe('refused: no credit');

    const tried: string[] = [];
    const ambiguous = route(modelSpec('ace-step-1.5')!, withFal, async (r) => {
      tried.push(r.kind);
      throw new DOMException('t', 'TimeoutError');
    });
    expect(ambiguous).rejects.toThrow();
    await ambiguous.catch(() => undefined);
    expect(tried).toEqual(['fal']);
  });

  test('no runner gives 503 with every reason', async () => {
    const error = await route(
      modelSpec('heartmula')!,
      { ...keys, replicate: false },
      async () => 1
    ).catch((e) => e);
    expect(error).toBeInstanceOf(NoRunner);
    expect(error.status).toBe(503);
    expect(error.attempts).toHaveLength(2);
  });

  test('replicate create refusals become RunnerRefused, others do not', () => {
    const refused = new ProviderError(402, 'x', 'replicate create failed with 402: y');
    expect(replicateRefusal(refused)).toBeInstanceOf(RunnerRefused);
    const shape = new ProviderError(502, 'x', 'bad prediction shape');
    expect(replicateRefusal(shape)).toBe(shape);
  });
});
