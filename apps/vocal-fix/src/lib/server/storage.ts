import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { VocalFixError } from './errors';

export const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const FILE_NAME = /^[a-z0-9][a-z0-9._-]{0,120}$/;

export type SessionMode = 'fix' | 'forge';

export interface Probe {
  codec: string;
  format: string;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_rate: number | null;
}

export interface Recording {
  id: string;
  index: number;
  original_name: string;
  stored_name: string;
  bytes: number;
  sha256: string;
  probe: Probe;
  integrity_verified: boolean;
  diagnosis?: unknown;
}

export interface DerivedVersion {
  id: string;
  kind: 'isolate' | 'enhance' | 'repair' | 'gold' | 'dataset';
  source_ids: string[];
  file: string;
  sha256: string;
  bytes: number;
  created_at: string;
  params: Record<string, unknown>;
  provenance: { step: string; tool: string; model?: string; prediction_id?: string }[];
  diagnosis?: unknown;
}

export interface AuditEvent {
  at: string;
  event: string;
  detail: Record<string, unknown>;
}

export interface Manifest {
  id: string;
  mode: SessionMode;
  performer: string;
  created_at: string;
  consent: { acknowledged_rights: true; statement: string; attested_at: string };
  recordings: Recording[];
  versions: DerivedVersion[];
  gold?: unknown;
  profile?: Record<string, string>;
  voices: string[];
  audit: AuditEvent[];
}

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Session storage rooted at <data>/vocal-fix/sessions; every path is checked against the root. */
export class SessionStore {
  readonly root: string;
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(dataDir: string) {
    this.root = resolve(dataDir, 'vocal-fix', 'sessions');
  }

  sessionDir(id: string): string {
    if (!SESSION_ID.test(id)) throw new VocalFixError('Unknown session.', 404);
    const dir = resolve(this.root, id);
    if (!dir.startsWith(this.root + sep)) throw new VocalFixError('Unknown session.', 404);
    return dir;
  }

  /** Resolve originals/<name> or derived/<name> inside a session, refusing traversal. */
  filePath(id: string, area: 'originals' | 'derived', name: string): string {
    if (!FILE_NAME.test(name) || name.includes('..')) throw new VocalFixError('Unknown file.', 404);
    const base = join(this.sessionDir(id), area);
    const full = resolve(base, name);
    if (!full.startsWith(base + sep)) throw new VocalFixError('Unknown file.', 404);
    return full;
  }

  async create(init: Omit<Manifest, 'id' | 'versions' | 'voices' | 'audit'>): Promise<Manifest> {
    const id = randomUUID();
    const dir = this.sessionDir(id);
    await mkdir(join(dir, 'originals'), { recursive: true });
    await mkdir(join(dir, 'derived'), { recursive: true });
    const manifest: Manifest = { id, ...init, versions: [], voices: [], audit: [] };
    await this.write(manifest);
    return manifest;
  }

  async read(id: string): Promise<Manifest> {
    const dir = this.sessionDir(id);
    try {
      return JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')) as Manifest;
    } catch {
      throw new VocalFixError('Unknown session.', 404);
    }
  }

  async write(manifest: Manifest): Promise<void> {
    const dir = this.sessionDir(manifest.id);
    const tmp = join(dir, 'manifest.json.' + randomUUID() + '.tmp');
    await writeFile(tmp, JSON.stringify(manifest, null, 2));
    await rename(tmp, join(dir, 'manifest.json'));
  }

  /** Serialized read-modify-write so concurrent jobs never drop each other's versions. */
  async update<T>(id: string, fn: (m: Manifest) => T | Promise<T>): Promise<T> {
    const prev = this.locks.get(id) ?? Promise.resolve();
    const next = prev.then(async () => {
      const m = await this.read(id);
      const result = await fn(m);
      await this.write(m);
      return result;
    });
    const settled = next.catch(() => undefined);
    this.locks.set(id, settled);
    try {
      return await next;
    } finally {
      if (this.locks.get(id) === settled) this.locks.delete(id);
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      await stat(join(this.sessionDir(id), 'manifest.json'));
      return true;
    } catch {
      return false;
    }
  }

  /** Removes the session directory (originals, derived files, manifest). */
  async remove(id: string): Promise<void> {
    if (!(await this.exists(id))) throw new VocalFixError('Unknown session.', 404);
    await rm(this.sessionDir(id), { recursive: true, force: true });
  }

  async nextVersion(m: Manifest, kind: DerivedVersion['kind'], stem: string): Promise<string> {
    const n = m.versions.filter((v) => v.kind === kind && v.file.startsWith(stem + '.')).length;
    return stem + '.' + kind + '.v' + (n + 1);
  }
}
