import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = () =>
  json({
    status: 'ok',
    app: 'ttb-studio-saas',
    version: '0.2.0',
    auth_ready: false,
    paid_generation_ready: false
  });
