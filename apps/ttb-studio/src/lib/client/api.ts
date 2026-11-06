export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (init.body) headers['content-type'] = 'application/json';
  const response = await fetch(url, { ...init, headers });
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => ({}))) as T & { detail?: string };
  if (!response.ok) throw new Error(body.detail || 'The ritual failed (' + response.status + ').');
  return body;
}

export const audioUrl = (id: string, stem?: string) =>
  '/api/studio/songs/' + encodeURIComponent(id) + '/audio' + (stem ? '?stem=' + stem : '');

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const coverUrl = (id: string, version = '') =>
  '/api/studio/songs/' +
  encodeURIComponent(id) +
  '/cover' +
  (version ? '?v=' + encodeURIComponent(version) : '');
