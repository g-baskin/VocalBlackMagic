import {
  ANTHROPIC_API_KEY,
  ELEVENLABS_API_KEY,
  FAL_KEY,
  GEMINI_API_KEY,
  MINIMAX_API_KEY,
  OPENAI_API_KEY,
  REPLICATE_API_TOKEN,
  VBM_ENGINE_TOKEN,
  VBM_ENGINE_URL
} from '$app/env/private';
import { errorResponse } from '../music/errors';
import { configuredKey, generationDisabledResponse, isJsonRequest } from '../music/gate';
import type { CreateDeps } from './create';
import type { EngineDeps } from './runners/engine';
import { LibraryError, SongLibrary } from './library';
import { dataDir, isLocalHost } from './paths';

export function studioContext(fetcher: typeof fetch): CreateDeps {
  const replicate = configuredKey(REPLICATE_API_TOKEN);
  const fal = configuredKey(FAL_KEY);
  const gemini = configuredKey(GEMINI_API_KEY);
  return {
    library: new SongLibrary(dataDir()),
    replicate: replicate ? { token: replicate, fetch: fetcher } : null,
    fal: fal ? { apiKey: fal, fetch: fetcher } : null,
    gemini: gemini ? { apiKey: gemini, fetch: fetcher } : null,
    direct: {
      anthropic: configuredKey(ANTHROPIC_API_KEY),
      openai: configuredKey(OPENAI_API_KEY),
      minimax: configuredKey(MINIMAX_API_KEY),
      elevenlabs: configuredKey(ELEVENLABS_API_KEY),
      engine: engineDeps(fetcher)
    },
    engine: engineDeps(fetcher),
    fetch: fetcher,
    now: () => new Date()
  };
}

function engineDeps(fetcher: typeof fetch): EngineDeps | null {
  const url = VBM_ENGINE_URL?.trim();
  const token = configuredKey(VBM_ENGINE_TOKEN);
  // Protocol v1: the engine always requires a token.
  return url && token ? { url, token, fetch: fetcher } : null;
}

export const noStore = { 'cache-control': 'no-store' };

/** Dev gate plus, for writes, a JSON content type so cross-site forms cannot trigger paid work. */
export function guard(request: Request, needsJson: boolean): Response | null {
  const disabled = generationDisabledResponse();
  if (disabled) return disabled;
  // DNS-rebinding guard: the dev server is only reachable as localhost / 127.0.0.1.
  if (!isLocalHost(request.headers.get('host')))
    return Response.json({ detail: 'The studio only answers on localhost.' }, { status: 403 });
  if (needsJson && !isJsonRequest(request))
    return Response.json({ detail: 'Send the request as application/json.' }, { status: 415 });
  return null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function studioError(error: unknown): Response {
  if (error instanceof LibraryError)
    return Response.json({ detail: error.message }, { status: error.status });
  return errorResponse(error);
}
