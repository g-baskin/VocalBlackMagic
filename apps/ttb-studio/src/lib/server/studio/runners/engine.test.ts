import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { EngineHealth, EngineJob, EngineJobRequest } from '@vbm/contracts';
import {
  RunnerRefused,
  cancelEngineJob,
  engineAudio,
  engineHealth,
  engineModelReason,
  getEngineJob,
  submitEngineJob,
  type EngineDeps
} from './engine';

const token = 'test-token';
const health: EngineHealth = {
  ok: true,
  protocol: 1,
  version: 'test',
  device: 'cpu',
  concurrency: 1,
  queued: 0,
  running: 0,
  models: [
    {
      id: 'ace-step-1.5',
      license: 'MIT',
      commercial: true,
      installed: true,
      ready: true,
      tasks: ['text2music', 'repaint'],
      max_duration_seconds: 240
    },
    {
      id: 'yue2',
      license: 'CC-BY-NC-4.0',
      commercial: false,
      installed: false,
      ready: false,
      tasks: ['text2music'],
      max_duration_seconds: 300,
      reason: 'weights not downloaded'
    }
  ]
};

// Test double for protocol v1: a tiny in-memory engine on a random port.
let server: ReturnType<typeof Bun.serve>;
const jobs = new Map<string, EngineJob>();
const keys = new Map<string, string>();
let deps: EngineDeps;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === '/v1/health') return Response.json(health);
      if (req.headers.get('authorization') !== 'Bearer ' + token)
        return Response.json({ detail: 'bad token', code: 'unauthorized' }, { status: 401 });
      if (url.pathname === '/v1/jobs' && req.method === 'POST') {
        const body = (await req.json()) as EngineJobRequest;
        if (body.model === 'yue2')
          return Response.json({ detail: 'not ready', code: 'model_not_ready' }, { status: 503 });
        const key = req.headers.get('idempotency-key') ?? '';
        const existing = keys.get(key);
        if (existing) return Response.json(jobs.get(existing), { status: 202 });
        const job: EngineJob = {
          id: 'job' + (jobs.size + 1),
          status: 'succeeded',
          model: body.model,
          task: body.task,
          created_at: new Date(0).toISOString(),
          output: {
            audio_url: '/v1/jobs/job' + (jobs.size + 1) + '/audio',
            format: 'wav',
            duration_seconds: 1,
            sample_rate: 44100,
            seed: 1
          }
        };
        jobs.set(job.id, job);
        keys.set(key, job.id);
        return Response.json(job, { status: 202 });
      }
      const m = /^\/v1\/jobs\/([^/]+)(\/audio)?$/.exec(url.pathname);
      const job = m && jobs.get(m[1]);
      if (!job) return Response.json({ detail: 'no', code: 'not_found' }, { status: 404 });
      if (m[2])
        return new Response(new Uint8Array([82, 73, 70, 70]), {
          headers: { 'content-type': 'audio/wav' }
        });
      if (req.method === 'DELETE') {
        job.status = 'cancelled';
        return Response.json(job);
      }
      return Response.json(job);
    }
  });
  deps = { url: 'http://127.0.0.1:' + server.port, token, fetch };
});
afterAll(() => server.stop(true));

const request: EngineJobRequest = {
  model: 'ace-step-1.5',
  task: 'text2music',
  prompt: 'dark synthwave',
  lyrics: '[Verse]\nhello',
  duration_seconds: 30
};

describe('engine runner (protocol v1)', () => {
  test('health and per-model readiness', async () => {
    const h = await engineHealth(deps);
    expect(engineModelReason(h, 'ace-step-1.5')).toBeNull();
    expect(engineModelReason(h, 'yue2')).toBe('weights not downloaded');
    expect(engineModelReason(h, 'heartmula')).toContain('does not serve');
  });

  test('submit is idempotent, poll, audio, cancel', async () => {
    const a = await submitEngineJob(deps, request, 'k1');
    const b = await submitEngineJob(deps, request, 'k1');
    expect(b.id).toBe(a.id);
    const polled = await getEngineJob(deps, a.id);
    expect(polled.status).toBe('succeeded');
    const audio = await engineAudio(deps, polled);
    expect(new Uint8Array(await audio.arrayBuffer())).toEqual(new Uint8Array([82, 73, 70, 70]));
    await cancelEngineJob(deps, a.id);
    expect((await getEngineJob(deps, a.id)).status).toBe('cancelled');
  });

  test('a create-time refusal is RunnerRefused (safe to fall back)', async () => {
    const error = await submitEngineJob(deps, { ...request, model: 'yue2' }, 'k2').catch((e) => e);
    expect(error).toBeInstanceOf(RunnerRefused);
    const bad = await submitEngineJob({ ...deps, token: 'wrong' }, request, 'k3').catch((e) => e);
    expect(bad).toBeInstanceOf(RunnerRefused);
  });

  test('refuses off-origin audio URLs and invalid requests', async () => {
    const job = await submitEngineJob(deps, request, 'k4');
    const evil = { ...job, output: { ...job.output!, audio_url: 'http://evil.example/a.wav' } };
    expect(engineAudio(deps, evil)).rejects.toThrow('off-host');
    expect(submitEngineJob(deps, { ...request, prompt: '' }, 'k5')).rejects.toBeInstanceOf(
      RunnerRefused
    );
  });
});
