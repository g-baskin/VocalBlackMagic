import { copyFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SongMeta } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import type { SongLibrary } from './library';
import {
  createPrediction,
  fetchOutput,
  getPrediction,
  isAllowedOutputUrl,
  readCapped,
  type ReplicateDeps
} from './replicate';

export const coverModel = { owner: 'black-forest-labs', name: 'flux-schnell' };
/** flux-schnell is $3 per 1000 images (Replicate pricing page, Nov 2026). */
export const coverCostUsd = 0.003;
const maxCoverBytes = 8 * 1024 * 1024;

const moods: [RegExp, string][] = [
  [/\b(love|heart|kiss|desire)\b/i, 'longing and devotion'],
  [/\b(fire|flame|burn|light|candle)\b/i, 'flickering flame and embers'],
  [/\b(night|moon|dark|shadow)\b/i, 'moonlit darkness'],
  [/\b(storm|sea|wave|ocean|rain)\b/i, 'storm-tossed water'],
  [/\b(death|lost|grave|ghost|soul)\b/i, 'mourning and spirits']
];

/** Art-direction prompt: arcane, symbolic, no text or real people. */
export function buildCoverPrompt(
  song: Pick<SongMeta, 'title' | 'prompt' | 'style_tags' | 'lyrics'>
): string {
  const words = (song.title + ' ' + (song.lyrics ?? '')).replace(/[^\p{L}\p{N}\s'-]/gu, ' ');
  const mood = moods.filter(([pattern]) => pattern.test(words)).map(([, m]) => m);
  const style = [song.prompt.slice(0, 160), ...song.style_tags.slice(0, 5)].join(', ');
  return [
    'Occult album cover art, arcane grimoire illustration, mystical sigils, sacred geometry, alchemical symbols,',
    'deep violet and ember glow with teal highlights, dramatic chiaroscuro, painterly, rich texture, square composition.',
    'Theme inspired by the song "' + song.title.replace(/["<>]/g, '').slice(0, 80) + '".',
    'Musical style: ' + style.replace(/["<>]/g, '') + '.',
    mood.length ? 'Mood: ' + mood.join(', ') + '.' : 'Mood: mysterious and haunting.',
    'Symbolic and abstract imagery only. No text, no letters, no words, no logos, no watermark, no real people, no faces of real persons.'
  ].join(' ');
}

export function sniffImage(bytes: Uint8Array): 'image/webp' | 'image/png' | 'image/jpeg' | null {
  const ascii = (o: number, n: number) => String.fromCharCode(...bytes.subarray(o, o + n));
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp';
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 3) === 'PNG') return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  return null;
}

const coverExt = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' } as const;

/** Generates, verifies and stores a cover for a library song, replacing any previous one. */
export async function conjureCover(
  library: SongLibrary,
  deps: ReplicateDeps,
  songId: string,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))
): Promise<SongMeta> {
  const song = await library.get(songId);
  let prediction = await createPrediction(
    deps,
    coverModel,
    {
      prompt: buildCoverPrompt(song),
      aspect_ratio: '1:1',
      output_format: 'webp',
      output_quality: 85,
      megapixels: '1'
    },
    { waitSeconds: 30 }
  );
  for (
    let i = 0;
    i < 30 && (prediction.status === 'starting' || prediction.status === 'processing');
    i += 1
  ) {
    await sleep(2000);
    prediction = await getPrediction(deps, prediction.id);
  }
  if (prediction.status !== 'succeeded')
    throw new ProviderError(
      502,
      'The cover could not be conjured.',
      'cover ' + prediction.status + ' ' + (prediction.error ?? '')
    );
  return storeCover(library, song.id, await coverBytes(deps.fetch, prediction.output));
}

const dataImage = /^data:image\/(?:webp|png|jpeg);base64,/;

/** Cover output is a replicate.delivery URL or (in wait mode) an inline base64 data URI. */
export async function coverBytes(fetcher: typeof fetch, output: unknown): Promise<Uint8Array> {
  const ref = Array.isArray(output) ? output[0] : output;
  if (typeof ref === 'string' && dataImage.test(ref)) {
    const data = ref.slice(ref.indexOf(',') + 1);
    if (data.length > maxCoverBytes * 1.4) throw new ProviderError(502, 'The cover is too large.');
    return new Uint8Array(Buffer.from(data, 'base64'));
  }
  if (!isAllowedOutputUrl(ref))
    throw new ProviderError(502, 'The cover came back from an unexpected place.');
  const response = await fetchOutput(fetcher, ref);
  if (!response.ok) throw new ProviderError(502, 'The cover could not be downloaded.');
  return readCapped(response, maxCoverBytes);
}

/** Verifies image bytes and stores them as the song's cover, replacing any previous one. */
export async function storeCover(
  library: SongLibrary,
  songId: string,
  bytes: Uint8Array
): Promise<SongMeta> {
  const song = await library.get(songId);
  const kind = sniffImage(bytes);
  if (!kind || bytes.length < 1024 || bytes.length > maxCoverBytes)
    throw new ProviderError(502, 'The cover is not a valid image.');
  const dir = library.songDir(song.id);
  const file = 'cover.' + coverExt[kind];
  if (song.cover && song.cover.file !== file)
    await rm(path.join(dir, song.cover.file), { force: true });
  await writeFile(path.join(dir, file), bytes);
  const fresh = await library.get(song.id);
  fresh.cover = { file, content_type: kind, bytes: bytes.length };
  fresh.est_cost_usd = Math.round((fresh.est_cost_usd + coverCostUsd) * 1000) / 1000;
  await library.save(fresh);
  return fresh;
}

/** Copies the parent's cover into a derived song's folder; returns the cover entry or undefined. */
export async function inheritCover(
  library: SongLibrary,
  parentId: string | null,
  dir: string
): Promise<SongMeta['cover']> {
  if (!parentId) return undefined;
  try {
    const parent = await library.get(parentId);
    if (!parent.cover) return undefined;
    const source = await library.assetFile(parentId, parent.cover.file);
    await copyFile(source, path.join(dir, parent.cover.file));
    return { ...parent.cover, inherited_from: parent.cover.inherited_from ?? parentId };
  } catch {
    return undefined;
  }
}
