import { self as sw } from '$app/service-worker';
import { assets, immutable } from '$app/manifest';
import { version } from '$app/env';
import { resolve } from '$app/paths';

// Offline app shell only. API calls, audio/media and non-GET requests always go to the network.
const CACHE = `vbm-shell-${version}`;
const SHELL = [...immutable, ...assets].map((f) => resolve(f.path as '/'));
const MEDIA = /\.(mp3|wav|flac|ogg|oga|m4a|aac|opus|webm|mp4)$/i;
// The app may be served under a base path (e.g. /vocal-fix); its API lives below it.
const API_PREFIX = resolve('/').replace(/\/$/, '') + '/api/';

sw.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

function cacheable(response: Response): boolean {
  const type = response.headers.get('content-type') ?? '';
  return (
    response.ok &&
    response.type === 'basic' &&
    !type.startsWith('audio/') &&
    !type.startsWith('video/')
  );
}

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== sw.location.origin) return;
  if (url.pathname.startsWith(API_PREFIX) || MEDIA.test(url.pathname)) return;
  if (request.headers.has('range')) return;
  const dest = request.destination;
  if (dest === 'audio' || dest === 'video') return;

  if (SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => (await cache.match(url.pathname)) ?? fetch(request))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (cacheable(response)) await cache.put(request, response.clone());
          return response;
        } catch {
          const cached = (await cache.match(request)) ?? (await cache.match(resolve('/')));
          return cached ?? new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
  }
});
