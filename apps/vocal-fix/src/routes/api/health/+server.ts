import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = () => json({
  status: 'ok',
  app: 'vocal-fix-saas',
  version: '0.2.0',
  public_upload_enabled: false,
  auth_ready: false
});
