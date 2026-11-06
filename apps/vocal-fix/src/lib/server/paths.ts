import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Repo root = nearest ancestor holding bun.lock; data dir = VBM_DATA_DIR or <root>/data. */
export function findRepoRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'bun.lock'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

export function dataDir(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.VBM_DATA_DIR?.trim();
  return explicit ? resolve(explicit) : join(findRepoRoot(process.cwd()), 'data');
}
