/**
 * Path prefix Vocal Fix is served under: '' locally, '/vocal-fix' behind the VBM Studio edge
 * Worker (set at build time with VITE_VBM_BASE; vite.config.ts passes the same value to
 * SvelteKit's paths.base). Links use resolve(); plain fetch/audio URLs go through apiPath().
 */
export function normaliseBase(raw: string | undefined): '' | `/${string}` {
  const base = (raw ?? '').trim().replace(/\/+$/, '');
  if (!base) return '';
  const segments = base.split('/').slice(1);
  if (!base.startsWith('/') || segments.some((s) => !/^[A-Za-z0-9_~-][A-Za-z0-9._~-]*$/.test(s)))
    throw new Error('VITE_VBM_BASE must look like /vocal-fix, got ' + JSON.stringify(raw));
  return base as `/${string}`;
}

export const BASE = normaliseBase(import.meta.env.VITE_VBM_BASE);

/** Root-relative app path (e.g. '/api/voices') with the base prefix. */
export const apiPath = (path: string): string => BASE + path;

/** Pathname without the base prefix, for server-side routing checks. */
export function stripBase(pathname: string, base: string = BASE): string {
  if (!base) return pathname;
  if (pathname === base) return '/';
  return pathname.startsWith(base + '/') ? pathname.slice(base.length) : pathname;
}
