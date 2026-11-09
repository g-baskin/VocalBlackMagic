import type { Handle } from '@sveltejs/kit/hooks';
import { stripBase } from './lib/base';
import { hostGuard, ownerGuard } from './lib/server/gate';

/**
 * Every API route refuses non-loopback Host headers (DNS rebinding) and, in owner mode, any
 * request without the edge secret, before any handler runs. The app may live under a base path.
 */
export const handle: Handle = async ({ event, resolve }) => {
  if (stripBase(event.url.pathname).startsWith('/api/')) {
    const blocked = ownerGuard(event.request) ?? hostGuard(event.request);
    if (blocked) return blocked;
  }
  return resolve(event);
};
