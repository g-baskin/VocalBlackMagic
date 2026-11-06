import { describe, expect, test } from 'bun:test';
import { RunnerRefused } from './engine';
import { elevenlabsGenerate, lyria3ProGenerate, minimaxGenerate } from './direct';

const mp3 = new Uint8Array(2048).fill(0);
mp3.set([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0]);
const input = {
  prompt: 'dark pop',
  lyrics: '[Verse]\nhi',
  instrumental: false,
  duration_seconds: 60
};

function fake(handler: (url: string, init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  }) as unknown as typeof fetch;
  return { fetch: fetcher, calls };
}

describe('direct adapters (mocked, never run live)', () => {
  test('MiniMax: hex audio, bearer auth, music-2.6', async () => {
    const hex = Buffer.from(mp3).toString('hex');
    const f = fake(() =>
      Response.json({ data: { audio: hex, status: 2 }, base_resp: { status_code: 0 } })
    );
    const result = await minimaxGenerate({ apiKey: 'k', fetch: f.fetch }, input);
    expect(new Uint8Array(await result.audio.arrayBuffer())).toEqual(mp3);
    expect(f.calls[0].url).toBe('https://api.minimax.io/v1/music_generation');
    expect(JSON.parse(String(f.calls[0].init.body)).model).toBe('music-2.6');
    expect((f.calls[0].init.headers as Record<string, string>).authorization).toBe('Bearer k');
  });

  test('MiniMax: status_code errors are refusals', async () => {
    const f = fake(() => Response.json({ base_resp: { status_code: 1004, status_msg: 'auth' } }));
    expect(minimaxGenerate({ apiKey: 'k', fetch: f.fetch }, input)).rejects.toBeInstanceOf(
      RunnerRefused
    );
  });

  test('ElevenLabs: binary audio, xi-api-key, instrumental flag', async () => {
    const f = fake(() => new Response(mp3, { headers: { 'content-type': 'audio/mpeg' } }));
    const result = await elevenlabsGenerate(
      { apiKey: 'k', fetch: f.fetch },
      { ...input, instrumental: true }
    );
    expect((await result.audio.arrayBuffer()).byteLength).toBe(2048);
    const body = JSON.parse(String(f.calls[0].init.body));
    expect(body.force_instrumental).toBe(true);
    expect(body.music_length_ms).toBe(60000);
    expect((f.calls[0].init.headers as Record<string, string>)['xi-api-key']).toBe('k');
    const refused = fake(() => new Response('no', { status: 401 }));
    expect(elevenlabsGenerate({ apiKey: 'k', fetch: refused.fetch }, input)).rejects.toBeInstanceOf(
      RunnerRefused
    );
  });

  test('Lyria 3 Pro: uses lyria-3-pro-preview; HTTP errors are refusals', async () => {
    const data = Buffer.from(mp3).toString('base64');
    const f = fake(() =>
      Response.json({ steps: [{ type: 'model_output', content: [{ type: 'audio', data }] }] })
    );
    const result = await lyria3ProGenerate({ apiKey: 'k', fetch: f.fetch }, input);
    expect(result.audio.headers.get('content-type')).toBe('audio/mpeg');
    expect(JSON.parse(String(f.calls[0].init.body)).model).toBe('lyria-3-pro-preview');
    const refused = fake(() => new Response('bad', { status: 400 }));
    expect(lyria3ProGenerate({ apiKey: 'k', fetch: refused.fetch }, input)).rejects.toBeInstanceOf(
      RunnerRefused
    );
  });
});
