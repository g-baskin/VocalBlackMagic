import { afterEach, describe, expect, mock, test } from 'bun:test';
import { generationAllowed, generationDisabledResponse, isOwnerEdgeRequest } from './gate';

// context.ts reads keys from SvelteKit's virtual env module; give it none.
mock.module('$app/env/private', () => ({
  ANTHROPIC_API_KEY: undefined,
  ELEVENLABS_API_KEY: undefined,
  FAL_KEY: undefined,
  GEMINI_API_KEY: undefined,
  MINIMAX_API_KEY: undefined,
  OPENAI_API_KEY: undefined,
  REPLICATE_API_TOKEN: undefined,
  VBM_ENGINE_TOKEN: undefined,
  VBM_ENGINE_URL: undefined
}));
const { guard } = await import('../studio/context');

const saved = { ...process.env };
const SECRET = 'e'.repeat(48);
afterEach(() => {
  for (const key of ['NODE_ENV', 'VBM_OWNER_MODE', 'VBM_EDGE_SECRET']) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function prod(owner: boolean, secret = SECRET) {
  process.env.NODE_ENV = 'production';
  if (owner) process.env.VBM_OWNER_MODE = '1';
  else delete process.env.VBM_OWNER_MODE;
  process.env.VBM_EDGE_SECRET = secret;
}
const req = (headers: Record<string, string>) =>
  new Request('http://localhost:3002/api/studio/songs', { headers });

describe('owner mode gate', () => {
  test('production stays closed without owner mode, even with the right secret', () => {
    prod(false);
    expect(generationAllowed(req({ 'x-vbm-edge-auth': SECRET }))).toBe(false);
    expect(generationDisabledResponse(req({ 'x-vbm-edge-auth': SECRET }))?.status).toBe(403);
  });

  test('owner mode admits only requests carrying the full edge secret', () => {
    prod(true);
    expect(isOwnerEdgeRequest(req({ 'x-vbm-edge-auth': SECRET }))).toBe(true);
    expect(isOwnerEdgeRequest(req({ 'x-vbm-edge-auth': SECRET.slice(1) }))).toBe(false);
    expect(isOwnerEdgeRequest(req({}))).toBe(false);
    expect(isOwnerEdgeRequest(undefined)).toBe(false);
    expect(generationAllowed()).toBe(false);
  });

  test('a short or missing secret disables owner mode', () => {
    prod(true, 'too-short');
    expect(isOwnerEdgeRequest(req({ 'x-vbm-edge-auth': 'too-short' }))).toBe(false);
    prod(true, '');
    expect(isOwnerEdgeRequest(req({ 'x-vbm-edge-auth': '' }))).toBe(false);
  });

  test('guard lets an owner request through regardless of host, others still get 403', () => {
    prod(true);
    const owner = new Request('http://vbm-studio.example.workers.dev/api/studio/songs', {
      headers: { host: 'vbm-studio.example.workers.dev', 'x-vbm-edge-auth': SECRET }
    });
    expect(guard(owner, false)).toBeNull();
    const stranger = new Request('http://localhost:3002/api/studio/songs', {
      headers: { host: 'localhost:3002' }
    });
    expect(guard(stranger, false)?.status).toBe(403);
    const ownerPlainText = new Request('http://localhost:3002/api/studio/songs', {
      method: 'POST',
      body: 'x',
      headers: { host: 'localhost:3002', 'x-vbm-edge-auth': SECRET, 'content-type': 'text/plain' }
    });
    expect(guard(ownerPlainText, true)?.status).toBe(415);
  });
});
