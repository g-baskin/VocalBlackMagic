/** Private local prototype API bridge; do not expose Python ports publicly. */
export function upstreamUrl(envKey: string, fallback: string, path: string): string {
  const raw = (process.env[envKey] || fallback).replace(/\/+$/, '');
  const parsed = new URL(raw);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported backend URL protocol');
  return raw + path;
}
export function upstreamUnavailable(error: unknown): Response {
  console.error('Local audio backend unavailable:', error instanceof Error ? error.message : String(error));
  return Response.json({ detail: 'Local audio backend is unavailable. Start the Python prototype on loopback.' }, { status: 503 });
}
export function passthrough(upstream: Response): Response {
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
