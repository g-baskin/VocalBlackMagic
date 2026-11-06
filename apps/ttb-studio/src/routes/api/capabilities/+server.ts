import { json } from '@sveltejs/kit';
import { FAL_KEY, GEMINI_API_KEY, REPLICATE_API_TOKEN } from '$app/env/private';
import type { RequestHandler } from './$types';
import { buildCapabilities } from '../../../lib/server/music/capabilities';
import { configuredKey, generationAllowed } from '../../../lib/server/music/gate';

export const GET: RequestHandler = () =>
  json(
    buildCapabilities({
      falConfigured: configuredKey(FAL_KEY) !== null,
      lyriaConfigured: configuredKey(GEMINI_API_KEY) !== null,
      generationAllowed: generationAllowed(),
      replicateConfigured: configuredKey(REPLICATE_API_TOKEN) !== null
    }),
    { headers: { 'cache-control': 'no-store' } }
  );
