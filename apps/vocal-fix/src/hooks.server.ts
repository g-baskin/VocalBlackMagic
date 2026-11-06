import type { Handle } from '@sveltejs/kit/hooks';
import { hostGuard } from './lib/server/gate';

/** Every API route refuses non-loopback Host headers (DNS rebinding), before any handler runs. */
export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/api/')) {
    const blocked = hostGuard(event.request);
    if (blocked) return blocked;
  }
  return resolve(event);
};
