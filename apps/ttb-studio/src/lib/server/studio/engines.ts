import {
  soundCharacterNames,
  type CreateSongRequest,
  type StudioEngine,
  type StudioEngineInfo
} from '@vbm/contracts';
import type { ReplicateModel } from './replicate';

export interface KeyState {
  replicate: boolean;
  fal: boolean;
  gemini: boolean;
  allowed: boolean;
}

type Spec = Omit<StudioEngineInfo, 'status'> & { needs: 'replicate' | 'fal' | 'gemini' };

// Limits and prices come from each model's published input schema and pricing page (Nov 2026).
const specs: Spec[] = [
  {
    id: 'minimax-music-1.5',
    name: 'MiniMax Music 1.5 — full songs with vocals (~$0.03/song)',
    vocals: true,
    instrumental: false,
    duration: null,
    max_lyrics: 600,
    max_prompt: 300,
    est_cost_usd: 0.03,
    needs: 'replicate'
  },
  {
    id: 'ace-step-replicate',
    name: 'ACE-Step on Replicate — vocals or instrumental (~$0.02)',
    vocals: true,
    instrumental: true,
    duration: { min: 10, max: 240 },
    max_lyrics: 4096,
    max_prompt: 512,
    est_cost_usd: 0.03,
    needs: 'replicate'
  },
  {
    id: 'stable-audio-2.5',
    name: 'Stable Audio 2.5 — instrumentals ($0.20/song)',
    vocals: false,
    instrumental: true,
    duration: { min: 10, max: 190 },
    max_lyrics: null,
    max_prompt: 1000,
    est_cost_usd: 0.2,
    needs: 'replicate'
  },
  {
    id: 'lyria-2',
    name: 'Google Lyria 2 — 30 s instrumentals (~$0.06)',
    vocals: false,
    instrumental: true,
    duration: null,
    max_lyrics: null,
    max_prompt: 1000,
    est_cost_usd: 0.06,
    needs: 'replicate'
  },
  {
    id: 'fal-ace-step',
    name: 'ACE-Step 1.5 via fal (~$0.0012/s)',
    vocals: true,
    instrumental: true,
    duration: { min: 10, max: 240 },
    max_lyrics: 4096,
    max_prompt: 450,
    est_cost_usd: 0.15,
    needs: 'fal'
  },
  {
    id: 'lyria-3.5',
    name: 'Google Lyria 3.5 ($0.08/song)',
    vocals: true,
    instrumental: true,
    duration: { min: 10, max: 240 },
    max_lyrics: 4096,
    max_prompt: 2500,
    est_cost_usd: 0.08,
    needs: 'gemini'
  }
];

const keyName = {
  replicate: 'REPLICATE_API_TOKEN',
  fal: 'FAL_KEY',
  gemini: 'GEMINI_API_KEY'
} as const;

export function engineInfos(keys: KeyState): StudioEngineInfo[] {
  return specs.map(({ needs, ...info }) => ({
    ...info,
    status: !keys.allowed
      ? 'disabled outside development'
      : keys[needs]
        ? 'ready'
        : 'needs ' + keyName[needs]
  }));
}

export function engineSpec(id: StudioEngine): Spec {
  const spec = specs.find((s) => s.id === id);
  if (!spec) throw new Error('unknown engine ' + id);
  return spec;
}

export const replicateModels = {
  'minimax-music-1.5': { owner: 'minimax', name: 'music-1.5' },
  'ace-step-replicate': {
    owner: 'lucataco',
    name: 'ace-step',
    version: '280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1'
  },
  'stable-audio-2.5': { owner: 'stability-ai', name: 'stable-audio-2.5' },
  'lyria-2': { owner: 'google', name: 'lyria-2' },
  reimagine: { owner: 'minimax', name: 'music-01' },
  demucs: {
    owner: 'ryan5453',
    name: 'demucs',
    version: 'ff5ad47d2685b27c0f820ee134c4394140804f08fa755cb20c846459faa4b337'
  },
  voice: {
    owner: 'zsxkib',
    name: 'realistic-voice-cloning',
    version: '0a9c7c558af4c0f20667c1bd1260ce32a2879944a0b9e44e1398660c077b1550'
  },
  lyricist: { owner: 'anthropic', name: 'claude-3.5-haiku' },
  lyricistFallback: { owner: 'anthropic', name: 'claude-4.5-haiku' }
} satisfies Record<string, ReplicateModel>;

export const derivedCosts = { reimagine: 0.035, stems: 0.03, voice: 0.045, lyrics: 0.005 };

/** Style prompt sent to the model: description, tags and the sound character. */
export function stylePrompt(
  request: Pick<CreateSongRequest, 'prompt' | 'style_tags' | 'sound_character'>
): string {
  const tags = request.style_tags.map((t) => t.trim()).filter(Boolean);
  return [
    request.prompt.trim(),
    tags.length ? 'Style: ' + tags.join(', ') + '.' : '',
    'Sound character: ' + soundCharacterNames[request.sound_character] + '.'
  ]
    .filter(Boolean)
    .join(' ');
}

/** MiniMax understands only lowercase [intro]/[verse]/[chorus]/[bridge]/[outro] tags. */
export function minimaxLyrics(lyrics: string): string {
  return lyrics
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      const tag = /^\s*\[\s*([a-z-]+)[^\]]*\]\s*$/i.exec(line);
      if (!tag) return line;
      const name = tag[1].toLowerCase();
      const mapped = name.startsWith('pre') ? 'verse' : name === 'hook' ? 'chorus' : name;
      return ['intro', 'verse', 'chorus', 'bridge', 'outro'].includes(mapped)
        ? '[' + mapped + ']'
        : '';
    })
    .filter((line, i, all) => line !== '' || (i > 0 && all[i - 1] !== ''))
    .join('\n')
    .trim();
}

/** Trims lyrics at a line boundary so a model's hard character limit is respected. */
export function fitLyrics(lyrics: string, max: number): string {
  if (lyrics.length <= max) return lyrics;
  const cut = lyrics.lastIndexOf('\n', max);
  return lyrics.slice(0, cut > 0 ? cut : max).trim();
}

/** Checks a create request against the chosen engine's real limits. */
export function engineRequestError(
  request: CreateSongRequest,
  lyrics: string | null
): string | null {
  const spec = engineSpec(request.engine);
  if (request.instrumental && !spec.instrumental)
    return spec.name.split(' —')[0] + ' cannot make instrumentals. Pick another engine.';
  if (!request.instrumental && !spec.vocals)
    return (
      spec.name.split(' —')[0] +
      ' makes instrumentals only. Turn on Instrumental or pick another engine.'
    );
  const prompt = stylePrompt(request);
  if (prompt.length > spec.max_prompt)
    return (
      'The style description is ' +
      (prompt.length - spec.max_prompt) +
      ' characters too long for this engine (max ' +
      spec.max_prompt +
      ').'
    );
  if (request.engine === 'minimax-music-1.5' && prompt.length < 10)
    return 'Describe the style in at least 10 characters.';
  if (lyrics && spec.max_lyrics) {
    const length =
      request.engine === 'minimax-music-1.5' ? minimaxLyrics(lyrics).length : lyrics.length;
    if (length > spec.max_lyrics)
      return 'Lyrics are ' + length + ' characters; this engine accepts ' + spec.max_lyrics + '.';
  }
  if (spec.duration && request.duration_seconds !== null) {
    if (
      request.duration_seconds < spec.duration.min ||
      request.duration_seconds > spec.duration.max
    )
      return (
        'This engine makes songs of ' + spec.duration.min + '–' + spec.duration.max + ' seconds.'
      );
  }
  return null;
}

/** Replicate input for a create request; lyrics must already be final (written or supplied). */
export function replicateInput(
  request: CreateSongRequest,
  lyrics: string | null
): Record<string, unknown> {
  const prompt = stylePrompt(request);
  const duration = request.duration_seconds ?? 120;
  switch (request.engine) {
    case 'minimax-music-1.5':
      if (!lyrics) throw new Error('MiniMax needs lyrics');
      return {
        prompt,
        lyrics: minimaxLyrics(lyrics),
        audio_format: 'mp3',
        sample_rate: 44100,
        bitrate: 256000
      };
    case 'ace-step-replicate':
      return { tags: prompt, lyrics: request.instrumental ? '[inst]' : (lyrics ?? ''), duration };
    case 'stable-audio-2.5':
      return { prompt, duration: Math.min(duration, 190), steps: 8 };
    case 'lyria-2':
      return { prompt };
    default:
      throw new Error('not a Replicate engine: ' + request.engine);
  }
}
