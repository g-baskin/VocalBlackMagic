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
  GEMINI_API_KEY: {
    description: 'Google Gemini API key with paid Lyria 3.5 access (server only).',
    schema: optionalKey
  }
});
