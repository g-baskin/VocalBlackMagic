/**
 * Direct provider adapters. All three answer synchronously with the audio, so a create-time HTTP
 * error means nothing was made (RunnerRefused, safe to fall back); a timeout is ambiguous and is not.
 *
 * MiniMax:    https://platform.minimax.io/docs/api-reference/music-generation
 *             (POST /v1/music_generation; note: paid music API closed to NEW users since 20 Aug 2026)
 * ElevenLabs: https://elevenlabs.io/docs/api-reference/music/compose (POST /v1/music)
 * Lyria 3 Pro: https://ai.google.dev/gemini-api/docs/music-generation (Interactions API,
 *             model id lyria-3-pro-preview per https://ai.google.dev/gemini-api/docs/models)
 */
import { generateLyria } from '../../music/lyria';
import { inspectBase64Audio } from '../../music/audio';
import { ProviderError } from '../../music/errors';
import { readCapped } from '../replicate';
import { RunnerRefused } from './engine';
import type { ModelInput } from './models';

export interface DirectDeps {
  apiKey: string;
  fetch: typeof fetch;
}

export interface DirectResult {
  audio: Response;
  lyrics: string | null;
}

const maxBytes = 160 * 1024 * 1024;
export const lyria3ProModel = 'lyria-3-pro-preview';

async function refusal(response: Response, provider: string): Promise<RunnerRefused> {
  const text = (await response.text().catch(() => '')).slice(0, 300);
  const log = provider + ' create failed with ' + response.status + ': ' + text;
  if (response.status === 401 || response.status === 403)
    return new RunnerRefused(502, provider + ' rejected the API key.', log);
  if (response.status === 402)
    return new RunnerRefused(402, provider + ' account has no credit.', log);
  if (response.status === 429) return new RunnerRefused(429, provider + ' is rate limiting.', log);
  if (response.status === 400 || response.status === 422)
    return new RunnerRefused(422, provider + ' rejected the request inputs.', log);
  return new RunnerRefused(502, provider + ' could not process the request.', log);
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new ProviderError(502, 'MiniMax returned bad audio.');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function minimaxBody(i: ModelInput, model = 'music-2.6'): Record<string, unknown> {
  return {
    model,
    prompt: i.prompt,
    ...(i.instrumental ? {} : { lyrics: i.lyrics ?? '' }),
    is_instrumental: i.instrumental,
    output_format: 'hex',
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' }
  };
}

export async function minimaxGenerate(deps: DirectDeps, i: ModelInput): Promise<DirectResult> {
  const response = await deps.fetch('https://api.minimax.io/v1/music_generation', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + deps.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(minimaxBody(i)),
    signal: AbortSignal.timeout(600_000)
  });
  if (!response.ok) throw await refusal(response, 'MiniMax');
  const data = (await response.json()) as {
    data?: { audio?: unknown; status?: unknown };
    base_resp?: { status_code?: unknown; status_msg?: unknown };
  };
  const code = data.base_resp?.status_code;
  // MiniMax reports most errors as HTTP 200 with a non-zero status_code; nothing was generated.
  if (code !== 0) {
    const log = 'MiniMax status_code ' + String(code) + ': ' + String(data.base_resp?.status_msg);
    if (code === 1002) throw new RunnerRefused(429, 'MiniMax is rate limiting.', log);
    if (code === 1004) throw new RunnerRefused(502, 'MiniMax rejected the API key.', log);
    if (code === 1008) throw new RunnerRefused(402, 'MiniMax account has no credit.', log);
    throw new RunnerRefused(422, 'MiniMax refused the request.', log);
  }
  if (typeof data.data?.audio !== 'string')
    throw new ProviderError(502, 'MiniMax finished without audio.');
  return {
    audio: new Response(Buffer.from(hexToBytes(data.data.audio)), {
      headers: { 'content-type': 'audio/mpeg' }
    }),
    lyrics: i.lyrics
  };
}

export function elevenlabsBody(i: ModelInput): Record<string, unknown> {
  return {
    prompt: i.prompt + (!i.instrumental && i.lyrics ? '\nLyrics:\n' + i.lyrics : ''),
    music_length_ms: Math.min(Math.max(Math.round(i.duration_seconds * 1000), 3000), 600_000),
    model_id: 'music_v1',
    force_instrumental: i.instrumental
  };
}

export async function elevenlabsGenerate(deps: DirectDeps, i: ModelInput): Promise<DirectResult> {
  const response = await deps.fetch(
    'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128',
    {
      method: 'POST',
      headers: { 'xi-api-key': deps.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify(elevenlabsBody(i)),
      signal: AbortSignal.timeout(600_000)
    }
  );
  if (!response.ok) throw await refusal(response, 'ElevenLabs');
  const bytes = await readCapped(response, maxBytes);
  return {
    audio: new Response(Buffer.from(bytes), { headers: { 'content-type': 'audio/mpeg' } }),
    lyrics: i.lyrics
  };
}

export async function lyria3ProGenerate(deps: DirectDeps, i: ModelInput): Promise<DirectResult> {
  try {
    const result = await generateLyria(
      deps,
      {
        prompt: i.prompt,
        lyrics: i.lyrics,
        mode: i.instrumental ? 'instrumental' : 'full-song',
        engine: 'lyria-3.5',
        sound_character: 'custom',
        premium_studio: false,
        texture: 50,
        human_variation: 50,
        mastering_intensity: 0,
        duration_seconds: Math.round(i.duration_seconds)
      },
      lyria3ProModel
    );
    inspectBase64Audio(result.audio.data_base64);
    return {
      audio: new Response(Buffer.from(result.audio.data_base64, 'base64'), {
        headers: { 'content-type': result.audio.content_type }
      }),
      lyrics: result.lyrics ?? i.lyrics
    };
  } catch (error) {
    // HTTP refusals from Lyria carry 'lyria failed with' in their log detail: nothing was generated.
    if (error instanceof ProviderError && error.logDetail?.startsWith('lyria failed with'))
      throw new RunnerRefused(error.status, error.publicMessage, error.logDetail);
    throw error;
  }
}
