import type { GenerationRequest, InlineAudio } from '@vbm/contracts';
import { inspectBase64Audio } from './audio';
import { ProviderError } from './errors';
import { styleDescription, sungLyrics } from './prompt';

const interactionsUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const lyriaModel = 'lyria-3.5';
export const lyriaApiRevision = '2026-05-20';

export interface LyriaDeps {
  apiKey: string;
  fetch: typeof fetch;
}

export function buildLyriaPrompt(request: GenerationRequest): string {
  const parts = [styleDescription(request)];
  const lyrics = sungLyrics(request);
  if (request.mode === 'instrumental') parts.push('Instrumental only, no vocals.');
  else if (lyrics) parts.push('Use these lyrics:\n' + lyrics);
  else parts.push('Write original lyrics and sing them with clear, intelligible words.');
  parts.push('Target length: about ' + request.duration_seconds + ' seconds.');
  return parts.join('\n\n');
}

interface ContentBlock {
  type?: unknown;
  data?: unknown;
  text?: unknown;
}
interface Step {
  type?: unknown;
  content?: unknown;
}

export function parseLyriaInteraction(data: unknown): {
  audio: InlineAudio;
  lyrics: string | null;
} {
  const steps =
    typeof data === 'object' && data !== null ? (data as { steps?: unknown }).steps : undefined;
  if (!Array.isArray(steps))
    throw new ProviderError(
      502,
      'Lyria returned an unexpected response.',
      'lyria response has no steps'
    );
  let audioData: string | null = null;
  const text: string[] = [];
  for (const step of steps as Step[]) {
    if (step?.type !== 'model_output' || !Array.isArray(step.content)) continue;
    for (const block of step.content as ContentBlock[]) {
      if (block?.type === 'audio' && typeof block.data === 'string') audioData = block.data;
      else if (block?.type === 'text' && typeof block.text === 'string') text.push(block.text);
    }
  }
  if (!audioData)
    throw new ProviderError(
      502,
      'Lyria finished without returning audio.',
      'lyria response has no audio block'
    );
  const { kind, bytes } = inspectBase64Audio(audioData);
  if (kind !== 'audio/mpeg' && kind !== 'audio/wav')
    throw new ProviderError(
      502,
      'Lyria returned an unsupported audio format.',
      'lyria audio kind ' + kind
    );
  return {
    audio: { content_type: kind, data_base64: audioData, bytes },
    lyrics: text.length ? text.join('\n') : null
  };
}

export async function generateLyria(
  deps: LyriaDeps,
  request: GenerationRequest,
  model: string = lyriaModel
): Promise<{ audio: InlineAudio; lyrics: string | null }> {
  const response = await deps.fetch(interactionsUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': deps.apiKey,
      'api-revision': lyriaApiRevision
    },
    body: JSON.stringify({ model, input: buildLyriaPrompt(request) }),
    signal: AbortSignal.timeout(300_000)
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const detail = 'lyria failed with ' + response.status + ': ' + body.slice(0, 300);
    if (response.status === 400)
      throw new ProviderError(
        422,
        'Lyria rejected the song request. Prompts that imitate real artists are one common cause.',
        detail
      );
    if (response.status === 401 || response.status === 403)
      throw new ProviderError(
        502,
        'Google rejected the API key or the project lacks paid Lyria access. Check GEMINI_API_KEY.',
        detail
      );
    // Google reports an unbilled project as a 429 with a zero free-tier quota; retrying cannot succeed.
    if (response.status === 429 && /free tier|limit:\s*0\b/i.test(body))
      throw new ProviderError(
        402,
        'Lyria has no free tier. Turn on billing for the Google project that owns GEMINI_API_KEY, then try again.',
        detail
      );
    if (response.status === 429)
      throw new ProviderError(429, 'Lyria is rate limiting requests. Try again shortly.', detail);
    throw new ProviderError(502, 'Lyria could not process the request.', detail);
  }
  return parseLyriaInteraction(await response.json());
}
