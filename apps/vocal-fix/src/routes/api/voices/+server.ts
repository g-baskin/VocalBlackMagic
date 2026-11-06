import type { RequestHandler } from './$types';
import { disabledResponse } from '../../../lib/server/gate';
import { svc } from '../../../lib/server/svc';

export const GET: RequestHandler = async () => {
  const blocked = disabledResponse();
  if (blocked) return blocked;
  return Response.json(await svc().registry.list(), { headers: { 'cache-control': 'no-store' } });
};
