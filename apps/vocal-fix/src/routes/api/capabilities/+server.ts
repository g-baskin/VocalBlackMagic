import type { RequestHandler } from './$types';
import { presets } from '../../../lib/server/chain';
import { processingAllowed } from '../../../lib/server/gate';
import { CONSENT_STATEMENT } from '../../../lib/server/forge';
import { MODELS } from '../../../lib/server/replicate';
import { RIGHTS_STATEMENT } from '../../../lib/server/service';
import { svc } from '../../../lib/server/svc';

export const GET: RequestHandler = async () =>
  Response.json(
    {
      architecture: 'SvelteKit server pipeline: local ffmpeg DSP + hosted Replicate inference',
      processing_allowed: processingAllowed(),
      hosted_ready: processingAllowed() && svc().hostedReady(),
      presets: Object.values(presets).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description
      })),
      models: Object.fromEntries(
        Object.entries(MODELS).map(([k, m]) => [k, { ref: m.ref, est_usd: m.est_usd }])
      ),
      rights_statement: RIGHTS_STATEMENT,
      consent_statement: CONSENT_STATEMENT,
      limits: { max_bytes: 100 * 1024 * 1024, max_seconds: 600 }
    },
    { headers: { 'cache-control': 'no-store' } }
  );
