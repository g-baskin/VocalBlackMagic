import { defineEnvVars } from '@sveltejs/kit/env';

// Optional so the app still starts without keys; each provider then answers 503.
const optionalKey = (value: string | undefined): string | undefined => value?.trim() || undefined;

export const variables = defineEnvVars({
  FAL_KEY: {
    description: 'fal.ai API key for ACE-Step song generation (server only).',
    schema: optionalKey
  },
  REPLICATE_API_TOKEN: {
    description: 'Replicate API token for studio engines, lyrics, stems and voice (server only).',
    schema: optionalKey
  },
  VBM_ENGINE_URL: {
    description: 'Base URL of a self-hosted VBM engine (protocol v1), e.g. http://127.0.0.1:8090.',
    schema: optionalKey
  },
  VBM_ENGINE_TOKEN: {
    description: 'Bearer token for the self-hosted VBM engine (server only).',
    schema: optionalKey
  },
  MINIMAX_API_KEY: {
    description: 'MiniMax API key for direct Music 2.6 generation (server only).',
    schema: optionalKey
  },
  ELEVENLABS_API_KEY: {
    description: 'ElevenLabs API key for direct music generation (server only).',
    schema: optionalKey
  },
  ANTHROPIC_API_KEY: {
    description: 'Anthropic API key for the lyricist (server only).',
    schema: optionalKey
  },
  OPENAI_API_KEY: {
    description: 'OpenAI API key for the lyricist fallback (server only).',
    schema: optionalKey
  },
  GEMINI_API_KEY: {
    description:
      'Google Gemini API key with paid Lyria 3.5 / Lyria 3 Pro and lyricist access (server only).',
    schema: optionalKey
  }
});
