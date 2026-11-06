import { defineEnvVars } from '@sveltejs/kit/env';

// Optional so the app still starts without a key; hosted stages then answer 503.
const optionalKey = (value: string | undefined): string | undefined => value?.trim() || undefined;

export const variables = defineEnvVars({
  REPLICATE_API_TOKEN: {
    description: 'Replicate API token for Demucs, resemble-enhance and RVC training (server only).',
    schema: optionalKey
  }
});
