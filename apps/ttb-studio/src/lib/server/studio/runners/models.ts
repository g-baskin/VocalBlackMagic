/**
 * Models x runners. A model makes the music; a runner is who runs it. Each model lists its
 * runners in preference order: self-hosted engine, then the provider's own API, then Replicate.
 * Replicate versions and inputs were read from GET /v1/models/{owner}/{name} (Nov 2026).
 */
import type { EngineModelId } from '@vbm/contracts';
import type { ReplicateModel } from '../replicate';

export type RunnerKind = 'engine' | 'fal' | 'minimax' | 'elevenlabs' | 'gemini' | 'replicate';

export const runnerKeys: Record<RunnerKind, string> = {
  engine: 'VBM_ENGINE_URL and VBM_ENGINE_TOKEN',
  fal: 'FAL_KEY',
  minimax: 'MINIMAX_API_KEY',
  elevenlabs: 'ELEVENLABS_API_KEY',
  gemini: 'GEMINI_API_KEY',
  replicate: 'REPLICATE_API_TOKEN'
};

/** What a song request carries into a runner's input builder. */
export interface ModelInput {
  prompt: string;
  lyrics: string | null;
  instrumental: boolean;
  duration_seconds: number;
}

export interface RunnerSpec {
  kind: RunnerKind;
  /** Exact model and version this runner actually runs (recorded in meta.json). */
  model_version: string;
  license: string;
  commercial: boolean;
  /** Present only for engine runners. */
  engine_model?: EngineModelId;
  /** Present only for Replicate runners. */
  replicate?: ReplicateModel;
  /** Provider-specific input; Replicate and direct adapters use it. */
  input?: (i: ModelInput) => Record<string, unknown>;
  /** Not wired yet: shown as unavailable with this reason, never run. */
  pending?: string;
}

export interface ModelSpec {
  id: string;
  name: string;
  open: boolean;
  vocals: boolean;
  instrumental: boolean;
  runners: RunnerSpec[];
}

const lyricsOrInst = (i: ModelInput, inst: string) => (i.instrumental ? inst : (i.lyrics ?? ''));

export const models: ModelSpec[] = [
  {
    id: 'ace-step-1.5',
    name: 'ACE-Step 1.5',
    open: true,
    vocals: true,
    instrumental: true,
    runners: [
      {
        kind: 'engine',
        engine_model: 'ace-step-1.5',
        model_version: 'ACE-Step 1.5 (self-hosted)',
        license: 'MIT',
        commercial: true
      },
      {
        kind: 'fal',
        model_version: 'fal-ai/ace-step-1.5',
        license: 'MIT',
        commercial: true
      },
      {
        kind: 'replicate',
        replicate: {
          owner: 'visoar',
          name: 'ace-step-1.5',
          version: 'fd851baef553cb1656f4a05e8f2f8641672f10bc808718f5718b4b4bb2b07794'
        },
        model_version: 'visoar/ace-step-1.5@fd851bae',
        license: 'MIT',
        commercial: true,
        input: (i) => ({
          caption: i.prompt,
          lyrics: lyricsOrInst(i, '[Instrumental]'),
          duration: Math.min(Math.max(Math.round(i.duration_seconds), 10), 600)
        })
      }
    ]
  },
  {
    id: 'heartmula',
    name: 'HeartMuLa',
    open: true,
    vocals: true,
    instrumental: false,
    runners: [
      {
        kind: 'engine',
        engine_model: 'heartmula',
        model_version: 'HeartMuLa (self-hosted)',
        license: 'Apache-2.0',
        commercial: true
      },
      {
        kind: 'replicate',
        replicate: {
          owner: 'meta-innovation',
          name: 'heart_mula',
          version: 'f654464a8b2e4824c74cb296b1cb47037037b02adbc6d8f8145fdc3a47ba6790'
        },
        model_version: 'meta-innovation/heart_mula@f654464a',
        license: 'Apache-2.0',
        commercial: true,
        input: (i) => ({
          tags: i.prompt,
          lyrics: i.lyrics ?? '',
          max_audio_length_ms: Math.min(Math.round(i.duration_seconds * 1000), 300_000)
        })
      }
    ]
  },
  {
    id: 'diffrhythm',
    name: 'DiffRhythm',
    open: true,
    vocals: true,
    instrumental: true,
    runners: [
      {
        kind: 'engine',
        engine_model: 'diffrhythm-2',
        model_version: 'DiffRhythm 2 (self-hosted)',
        license: 'Apache-2.0',
        commercial: true
      },
      {
        kind: 'replicate',
        replicate: {
          owner: 'jourdelune',
          name: 'diffrhythm',
          version: '4b0f15c352ce0508a34eaf09f8336f70334240643113a4091fb4f79feb57be03'
        },
        model_version: 'DiffRhythm v1 (jourdelune/diffrhythm@4b0f15c3)',
        license: 'Apache-2.0',
        commercial: true,
        // The v1 schema offers 95 s (base) or 285 s (full) songs only.
        input: (i) => ({
          lyric: i.instrumental ? '' : (i.lyrics ?? ''),
          ref_prompt: i.prompt,
          audio_length: i.duration_seconds > 95 ? 285 : 95
        })
      }
    ]
  },
  {
    id: 'yue',
    name: 'YuE',
    open: true,
    vocals: true,
    instrumental: false,
    runners: [
      {
        kind: 'engine',
        engine_model: 'yue2',
        model_version: 'YuE2 (self-hosted)',
        license: 'CC-BY-NC-4.0',
        commercial: false
      },
      {
        kind: 'replicate',
        replicate: {
          owner: 'fofr',
          name: 'yue',
          version: 'f45da0cfbe372eb9116e87a1e3519aceb008fd03b0d771d21fb8627bee2b4117'
        },
        model_version: 'YuE v1 7B (fofr/yue@f45da0cf)',
        license: 'Apache-2.0',
        commercial: true,
        input: (i) => ({
          genre_description: i.prompt,
          lyrics: i.lyrics ?? '',
          num_segments: Math.min(Math.max(Math.round(i.duration_seconds / 30), 1), 10)
        })
      }
    ]
  },
  {
    id: 'minimax-music-2.6',
    name: 'MiniMax Music 2.6',
    open: false,
    vocals: true,
    instrumental: true,
    runners: [
      {
        kind: 'minimax',
        model_version: 'music-2.6 (MiniMax API; closed to new paid users since Aug 2026)',
        license: 'Proprietary',
        commercial: true
      },
      {
        kind: 'replicate',
        replicate: { owner: 'minimax', name: 'music-2.6' },
        model_version: 'minimax/music-2.6@dcd69b2c',
        license: 'Proprietary',
        commercial: true,
        input: (i) => ({
          prompt: i.prompt,
          lyrics: i.instrumental ? '' : (i.lyrics ?? ''),
          is_instrumental: i.instrumental,
          audio_format: 'mp3',
          sample_rate: 44100,
          bitrate: 256000
        })
      }
    ]
  },
  {
    id: 'lyria-3-pro',
    name: 'Google Lyria 3 Pro',
    open: false,
    vocals: true,
    instrumental: true,
    runners: [
      {
        kind: 'gemini',
        model_version: 'lyria-3-pro-preview (Gemini API)',
        license: 'Proprietary',
        commercial: true
      },
      {
        kind: 'replicate',
        replicate: { owner: 'google', name: 'lyria-3-pro' },
        model_version: 'google/lyria-3-pro@a8d2354e',
        license: 'Proprietary',
        commercial: true,
        input: (i) => ({
          prompt:
            i.prompt +
            (i.instrumental ? '\nInstrumental only.' : i.lyrics ? '\nLyrics:\n' + i.lyrics : '')
        })
      }
    ]
  },
  {
    id: 'elevenlabs-music',
    name: 'ElevenLabs Music',
    open: false,
    vocals: true,
    instrumental: true,
    runners: [
      {
        kind: 'elevenlabs',
        model_version: 'music_v1 (ElevenLabs API)',
        license: 'Proprietary',
        commercial: true
      },
      {
        kind: 'replicate',
        replicate: { owner: 'elevenlabs', name: 'music' },
        model_version: 'elevenlabs/music@66fa53d4',
        license: 'Proprietary',
        commercial: true,
        input: (i) => ({
          prompt: i.prompt + (!i.instrumental && i.lyrics ? '\nLyrics:\n' + i.lyrics : ''),
          music_length_ms: Math.min(
            Math.max(Math.round(i.duration_seconds * 1000), 10_000),
            300_000
          ),
          force_instrumental: i.instrumental
        })
      }
    ]
  }
];

export function modelSpec(id: string): ModelSpec | undefined {
  return models.find((m) => m.id === id);
}
