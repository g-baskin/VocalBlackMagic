import { existsSync } from 'node:fs';
import path from 'node:path';

/** VBM_DATA_DIR, or <repo root>/data where the repo root is the nearest folder holding bun.lock. */
export function resolveDataDir(env: string | undefined, cwd: string): string {
  if (env?.trim()) return path.resolve(env.trim());
  let dir = path.resolve(cwd);
  for (;;) {
    if (existsSync(path.join(dir, 'bun.lock'))) return path.join(dir, 'data');
    const parent = path.dirname(dir);
    if (parent === dir) return path.join(path.resolve(cwd), 'data');
    dir = parent;
  }
}

export function dataDir(): string {
  return resolveDataDir(process.env.VBM_DATA_DIR, process.cwd());
}

/** DNS-rebinding guard: only localhost names may reach the dev studio. */
export function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const name = host.replace(/:\d+$/, '').toLowerCase();
  return name === 'localhost' || name === '127.0.0.1' || name === '[::1]';
}
