import { describe, expect, test } from 'bun:test';
import { modelInfos } from './capabilities';

const none = {
  engine: null,
  fal: false,
  minimax: false,
  elevenlabs: false,
  gemini: false,
  replicate: false
};

describe('capabilities', () => {
  test('plain reasons and licence badges', async () => {
    const infos = await modelInfos({ ...none, replicate: true }, true);
    const yue = infos.find((m) => m.id === 'yue')!;
    expect(yue.runners[0].license_badge).toBe('Non-commercial');
    expect(yue.runners[0].status).toBe('needs VBM_ENGINE_URL and VBM_ENGINE_TOKEN');
    expect(yue.active_runner).toBe('replicate');
    const eleven = infos.find((m) => m.id === 'elevenlabs-music')!;
    expect(eleven.runners[0].status).toBe('needs ELEVENLABS_API_KEY');
  });

  test('outside development nothing is ready', async () => {
    const infos = await modelInfos({ ...none, replicate: true }, false);
    expect(infos.every((m) => m.active_runner === null)).toBe(true);
  });
});
