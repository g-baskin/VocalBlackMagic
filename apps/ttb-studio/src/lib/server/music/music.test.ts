import { describe, expect, test } from 'bun:test';
import type { GenerationRequest } from '@vbm/contracts';
import { inspectBase64Audio, sniffAudio, verifiedAudioResponse } from './audio';
import { buildCapabilities } from './capabilities';
import { ProviderError } from './errors';
import { buildFalSubmission, falAudioUrl, falStatus, isAllowedFalMediaUrl, submitFal } from './fal';
import { falJobId, parseJobId } from './jobs';
import { isJsonRequest } from './gate';
import { buildLyriaPrompt, generateLyria, parseLyriaInteraction } from './lyria';

const base: GenerationRequest = {
  prompt: 'Dark boom bap with haunting piano',
  lyrics: null,
  mode: 'full-song',
  engine: 'ace-step',
  sound_character: 'raw',
  premium_studio: false,
  texture: 70,
  human_variation: 65,
  mastering_intensity: 25,
  duration_seconds: 90
};
const requestId = '764cabcf-b745-4b3e-ae38-1200304cf45b';
const ascii = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0));
const wavBytes = (size: number) => { const b = new Uint8Array(size); b.set(ascii('RIFF'), 0); b.set(ascii('WAVE'), 8); return b; };
const mp3Base64 = (size: number) => { const b = new Uint8Array(size); b.set(ascii('ID3'), 0); return Buffer.from(b).toString('base64'); };

type Call = { url: string; init?: RequestInit };
function fakeFetch(responses: Response[]): { fetch: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const queue = [...responses];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const next = queue.shift();
    if (!next) throw new Error('unexpected fetch');
    return next;
  }) as typeof fetch;
  return { fetch: fn, calls };
}

describe('audio verification', () => {
  test('recognises wav and mp3 and rejects text', () => {
    expect(sniffAudio(wavBytes(12))).toBe('audio/wav');
    expect(sniffAudio(ascii('ID3abc'))).toBe('audio/mpeg');
    expect(sniffAudio(Uint8Array.from([0xff, 0xfb, 0x90]))).toBe('audio/mpeg');
    expect(sniffAudio(Uint8Array.from([0xff, 0xf1, 0x50]))).toBeNull();
    expect(sniffAudio(ascii('<html>error'))).toBeNull();
  });
  test('inline base64 audio must be real and non-trivial', () => {
    expect(inspectBase64Audio(mp3Base64(2048))).toEqual({ kind: 'audio/mpeg', bytes: 2048 });
    expect(() => inspectBase64Audio(mp3Base64(100))).toThrow(ProviderError);
    expect(() => inspectBase64Audio(Buffer.from('x'.repeat(4000)).toString('base64'))).toThrow(ProviderError);
    expect(() => inspectBase64Audio('not base64!')).toThrow(ProviderError);
  });
  test('streams verified audio with its sniffed type', async () => {
    const response = await verifiedAudioResponse(new Response(wavBytes(4096), { headers: { 'content-type': 'text/html' } }));
    expect(response.headers.get('content-type')).toBe('audio/wav');
    expect((await response.arrayBuffer()).byteLength).toBe(4096);
  });
  test('fails truncated or oversized downloads instead of serving them', async () => {
    const drain = async (response: Response) => (await verifiedAudioResponse(response)).arrayBuffer();
    await expect(drain(new Response(wavBytes(500)))).rejects.toBeDefined();
    await expect(drain(new Response(wavBytes(4096), { headers: { 'content-length': String(200 * 1024 * 1024) } }))).rejects.toThrow(ProviderError);
  });
  test('refuses non-audio downloads', async () => {
    await expect(verifiedAudioResponse(new Response('<html>' + 'x'.repeat(2000)))).rejects.toThrow(ProviderError);
    await expect(verifiedAudioResponse(new Response('gone', { status: 404 }))).rejects.toThrow(ProviderError);
  });
});

describe('fal ACE-Step adapter', () => {
  test('uses prompt-to-audio without lyrics and the lyric endpoint with them', () => {
    expect(buildFalSubmission({ ...base, mode: 'instrumental' })).toMatchObject({
      endpoint: 'fal-ai/ace-step/prompt-to-audio', body: { instrumental: true, duration: 90, enable_safety_checker: true }
    });
    const sung = buildFalSubmission({ ...base, lyrics: '[verse]\nline one' });
    expect(sung.endpoint).toBe('fal-ai/ace-step');
    expect(sung.body.lyrics).toBe('[verse]\nline one');
    expect(buildFalSubmission({ ...base, mode: 'instrumental', lyrics: 'ignored' }).body.lyrics).toBeUndefined();
  });
  test('submits to the queue with the key in the header only', async () => {
    const { fetch, calls } = fakeFetch([Response.json({ request_id: requestId })]);
    expect(await submitFal({ apiKey: 'secret', fetch }, base)).toBe(requestId);
    expect(calls[0].url).toBe('https://queue.fal.run/fal-ai/ace-step/prompt-to-audio');
    expect((calls[0].init?.headers as Record<string, string>).authorization).toBe('Key secret');
    expect(String(calls[0].init?.body)).not.toContain('secret');
  });
  test('maps queue states and failures', async () => {
    const { fetch, calls } = fakeFetch([
      Response.json({ status: 'IN_QUEUE' }), Response.json({ status: 'IN_PROGRESS' }),
      Response.json({ status: 'COMPLETED' }), Response.json({ status: 'COMPLETED', error: 'boom' })
    ]);
    const deps = { apiKey: 'k', fetch };
    expect((await falStatus(deps, requestId)).status).toBe('queued');
    expect((await falStatus(deps, requestId)).status).toBe('running');
    expect((await falStatus(deps, requestId)).status).toBe('completed');
    expect((await falStatus(deps, requestId)).status).toBe('failed');
    expect(calls[0].url).toBe('https://queue.fal.run/fal-ai/ace-step/requests/' + requestId + '/status');
  });
  test('reports missing credit and bad keys clearly', async () => {
    const { fetch } = fakeFetch([new Response('no credit', { status: 402 }), new Response('bad', { status: 401 })]);
    await expect(submitFal({ apiKey: 'k', fetch }, base)).rejects.toMatchObject({ status: 402 });
    await expect(submitFal({ apiKey: 'k', fetch }, base)).rejects.toMatchObject({ status: 502, publicMessage: 'fal rejected the API key. Check FAL_KEY.' });
  });
  test('a missing job reads as not found only after submission', async () => {
    const { fetch } = fakeFetch([new Response('nope', { status: 404 }), new Response('nope', { status: 404 })]);
    await expect(falStatus({ apiKey: 'k', fetch }, requestId)).rejects.toMatchObject({ status: 404 });
    await expect(submitFal({ apiKey: 'k', fetch }, base)).rejects.toMatchObject({ status: 502 });
  });
  test('only follows audio URLs on fal media hosts', async () => {
    expect(isAllowedFalMediaUrl('https://v3.fal.media/files/a/song.wav')).toBe(true);
    expect(isAllowedFalMediaUrl('https://storage.googleapis.com/falserverless/x.wav')).toBe(true);
    expect(isAllowedFalMediaUrl('http://v3.fal.media/files/a/song.wav')).toBe(false);
    expect(isAllowedFalMediaUrl('https://evil.example/fal.media/x.wav')).toBe(false);
    expect(isAllowedFalMediaUrl('https://fal.media.evil.example/x.wav')).toBe(false);
    expect(isAllowedFalMediaUrl('https://169.254.169.254/latest')).toBe(false);
    const { fetch } = fakeFetch([Response.json({ audio: { url: 'https://127.0.0.1/secret' } })]);
    await expect(falAudioUrl({ apiKey: 'k', fetch }, requestId)).rejects.toThrow(ProviderError);
  });
  test('job ids round-trip and reject other providers', () => {
    expect(parseJobId(falJobId(requestId))).toEqual({ provider: 'fal', requestId });
    expect(parseJobId('lyria.abc')).toEqual({ provider: 'lyria' });
    expect(parseJobId('other')).toBeNull();
  });
});

describe('Google Lyria 3.5 adapter', () => {
  test('prompt carries mode, lyrics and target length', () => {
    expect(buildLyriaPrompt({ ...base, mode: 'instrumental', lyrics: 'skip me' })).toContain('Instrumental only, no vocals.');
    expect(buildLyriaPrompt({ ...base, mode: 'instrumental', lyrics: 'skip me' })).not.toContain('skip me');
    const sung = buildLyriaPrompt({ ...base, lyrics: '[Chorus]\nhey' });
    expect(sung).toContain('Use these lyrics:\n[Chorus]\nhey');
    expect(sung).toContain('about 90 seconds');
  });
  test('extracts verified audio and lyrics from model_output steps', () => {
    const data = mp3Base64(4096);
    const parsed = parseLyriaInteraction({ steps: [
      { type: 'user_input', content: [{ type: 'text', text: 'ignored' }] },
      { type: 'model_output', content: [{ type: 'text', text: '[Verse] words' }, { type: 'audio', data }] }
    ] });
    expect(parsed.audio).toEqual({ content_type: 'audio/mpeg', data_base64: data, bytes: 4096 });
    expect(parsed.lyrics).toBe('[Verse] words');
  });
  test('never reports success without audio', () => {
    expect(() => parseLyriaInteraction({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'x' }] }] })).toThrow(ProviderError);
    expect(() => parseLyriaInteraction({})).toThrow(ProviderError);
  });
  test('sends the documented headers and model', async () => {
    const { fetch, calls } = fakeFetch([Response.json({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: mp3Base64(2048) }] }] })]);
    await generateLyria({ apiKey: 'g-key', fetch }, { ...base, engine: 'lyria-3.5' });
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(calls[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(headers['x-goog-api-key']).toBe('g-key');
    expect(headers['api-revision']).toBe('2026-05-20');
    expect(JSON.parse(String(calls[0].init?.body)).model).toBe('lyria-3.5');
  });
  test('an unbilled project asks for billing instead of a retry', async () => {
    const freeTier = JSON.stringify({ error: { message: 'Rate limit exceeded for model lyria-3-pro (limit: 0 requests per day on Free Tier). Please upgrade your tier at https://ai.dev/rate-limit.', code: 'too_many_requests' } });
    const { fetch } = fakeFetch([new Response(freeTier, { status: 429 }), new Response('{"error":{"message":"Too many requests"}}', { status: 429 })]);
    const request = { ...base, engine: 'lyria-3.5' as const };
    await expect(generateLyria({ apiKey: 'g-key', fetch }, request)).rejects.toMatchObject({
      status: 402,
      publicMessage: 'Lyria has no free tier. Turn on billing for the Google project that owns GEMINI_API_KEY, then try again.'
    });
    await expect(generateLyria({ apiKey: 'g-key', fetch }, request)).rejects.toMatchObject({ status: 429, publicMessage: 'Lyria is rate limiting requests. Try again shortly.' });
  });
});

describe('capabilities', () => {
  test('reports missing keys and the development gate honestly', () => {
    const none = buildCapabilities({ falConfigured: false, lyriaConfigured: false, generationAllowed: true });
    expect(none.generation_ready).toBe(false);
    expect(none.engines.find((e) => e.id === 'ace-step')?.status).toBe('needs FAL_KEY');
    const prod = buildCapabilities({ falConfigured: true, lyriaConfigured: true, generationAllowed: false });
    expect(prod.generation_ready).toBe(false);
    expect(buildCapabilities({ falConfigured: false, lyriaConfigured: true, generationAllowed: true }).generation_ready).toBe(true);
  });
});

describe('request gate', () => {
  test('only JSON requests may start paid generation', () => {
    const post = (type?: string) => new Request('http://127.0.0.1/api/generations', { method: 'POST', headers: type ? { 'content-type': type } : {} });
    expect(isJsonRequest(post('application/json'))).toBe(true);
    expect(isJsonRequest(post('Application/JSON; charset=utf-8'))).toBe(true);
    expect(isJsonRequest(post('text/plain'))).toBe(false);
    expect(isJsonRequest(post('application/x-www-form-urlencoded'))).toBe(false);
    expect(isJsonRequest(post())).toBe(false);
  });
});
