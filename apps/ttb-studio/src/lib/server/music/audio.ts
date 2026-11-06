import { ProviderError } from './errors';

export type AudioKind = 'audio/wav' | 'audio/mpeg' | 'audio/flac' | 'audio/ogg';
export const minAudioBytes = 1024;
export const maxAudioBytes = 160 * 1024 * 1024;

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

export function sniffAudio(head: Uint8Array): AudioKind | null {
  if (head.length >= 12 && ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WAVE') return 'audio/wav';
  if (head.length >= 3 && ascii(head, 0, 3) === 'ID3') return 'audio/mpeg';
  // MPEG audio frame sync with a non-reserved layer (rejects AAC ADTS, whose layer bits are 00).
  if (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0 && (head[1] & 0x06) !== 0) return 'audio/mpeg';
  if (head.length >= 4 && ascii(head, 0, 4) === 'fLaC') return 'audio/flac';
  if (head.length >= 4 && ascii(head, 0, 4) === 'OggS') return 'audio/ogg';
  return null;
}

const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

export function inspectBase64Audio(data: string): { kind: AudioKind; bytes: number } {
  if (data.length % 4 !== 0 || !base64Pattern.test(data))
    throw new ProviderError(502, 'The provider returned malformed audio data.');
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  const bytes = (data.length / 4) * 3 - padding;
  if (bytes < minAudioBytes) throw new ProviderError(502, 'The provider returned an empty or truncated audio file.');
  if (bytes > maxAudioBytes) throw new ProviderError(502, 'The provider returned an audio file that is too large.');
  const head = Uint8Array.from(atob(data.slice(0, 16)), (char) => char.charCodeAt(0));
  const kind = sniffAudio(head);
  if (!kind) throw new ProviderError(502, 'The provider returned a file that is not recognisable audio.');
  return { kind, bytes };
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export async function verifiedAudioResponse(upstream: Response): Promise<Response> {
  if (!upstream.ok || !upstream.body)
    throw new ProviderError(502, 'The audio file could not be retrieved from the provider.', 'audio fetch status ' + upstream.status);
  const declared = Number(upstream.headers.get('content-length'));
  const hasLength = upstream.headers.has('content-length') && Number.isFinite(declared);
  if (hasLength && (declared < minAudioBytes || declared > maxAudioBytes)) {
    await upstream.body.cancel();
    throw new ProviderError(502, 'The provider audio file has an unexpected size.');
  }
  const reader = upstream.body.getReader();
  let head: Uint8Array = new Uint8Array(0);
  while (head.length < 12) {
    const { done, value } = await reader.read();
    if (done) break;
    head = concat(head, value);
  }
  const kind = sniffAudio(head);
  if (!kind) {
    await reader.cancel();
    throw new ProviderError(502, 'The provider returned a file that is not recognisable audio.');
  }
  let total = head.length;
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(head); },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        if (total < minAudioBytes) controller.error(new Error('Audio file is truncated.'));
        else controller.close();
        return;
      }
      total += value.length;
      if (total > maxAudioBytes) {
        await reader.cancel();
        controller.error(new Error('Audio file exceeds the size limit.'));
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) { return reader.cancel(reason); }
  });
  const headers: Record<string, string> = {
    'content-type': kind,
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff'
  };
  if (hasLength) headers['content-length'] = String(declared);
  return new Response(body, { status: 200, headers });
}
