// Worker entry: Cloudflare Access check (index.ts), then the single studio Container instance.
// The container's own data dir is mirrored to R2 by its sync agent through host r2.vbm (r2-store.ts).
import { Container, getContainer } from '@cloudflare/containers';
import { handle, type Env as EdgeEnv } from './index';
import { handleR2, type R2Like } from './r2-store';

const PROVIDER_KEYS = [
  'REPLICATE_API_TOKEN',
  'FAL_KEY',
  'GEMINI_API_KEY',
  'MINIMAX_API_KEY',
  'ELEVENLABS_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY'
] as const;

export interface Env extends Omit<EdgeEnv, 'STUDIO'> {
  CONTAINER: DurableObjectNamespace<StudioContainer>;
  DATA: R2Bucket;
  REPLICATE_API_TOKEN?: string;
  FAL_KEY?: string;
  GEMINI_API_KEY?: string;
  MINIMAX_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

/** Header the studio reads as its protocol (PROTOCOL_HEADER) so its CSRF origin matches ORIGIN_URL. */
const PROTO_HEADER = 'x-vbm-origin-proto';

export function containerEnv(env: Env): Record<string, string> {
  const vars: Record<string, string> = {
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    PORT: '3002',
    VBM_DATA_DIR: '/data',
    FFMPEG_PATH: '/usr/bin/ffmpeg',
    VBM_FFMPEG: '/usr/bin/ffmpeg',
    VBM_FFPROBE: '/usr/bin/ffprobe',
    VBM_OWNER_MODE: '1',
    VBM_EDGE_SECRET: env.EDGE_SECRET ?? '',
    VBM_SYNC_URL: 'http://r2.vbm',
    PROTOCOL_HEADER: PROTO_HEADER,
    // Cloudflare caps request bodies at 100 MB; let the studio accept anything that gets through.
    BODY_SIZE_LIMIT: '110M'
  };
  for (const name of PROVIDER_KEYS) if (env[name]) vars[name] = env[name] as string;
  return vars;
}

export class StudioContainer extends Container<Env> {
  defaultPort = 3002;
  sleepAfter = '15m';
  enableInternet = true;

  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    this.envVars = containerEnv(env);
  }
}

StudioContainer.outboundByHost = {
  'r2.vbm': (request: Request, env: Env) => handleR2(request, env.DATA as unknown as R2Like)
};

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const studio = {
      fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> {
        const forwarded = new Request(input, init);
        forwarded.headers.set(PROTO_HEADER, new URL(forwarded.url).protocol.replace(':', ''));
        return getContainer(env.CONTAINER, 'owner').fetch(forwarded);
      }
    };
    return handle(request, { ...env, STUDIO: studio });
  }
};
