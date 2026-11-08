// @ts-check
/**
 * VBM Studio data-dir <-> R2 sync agent (runs inside the Cloudflare Container).
 *
 *   bun sync-agent.ts restore   download everything from R2 that is missing or differs in size
 *   bun sync-agent.ts run       watch the data dir and mirror changes to R2 until SIGTERM/SIGINT
 *
 * R2 is reached through a Worker outbound handler at VBM_SYNC_URL (default http://r2.vbm).
 */
import { randomBytes } from 'node:crypto';
import { watch, type FSWatcher } from 'node:fs';
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface SyncConfig {
  dataDir: string;
  baseUrl: string;
  fetch: FetchLike;
  log: (line: string) => void;
  /** Base delay for retry backoff in ms (tests use 1). */
  retryDelayMs: number;
  retries: number;
}

export interface FileStat {
  size: number;
  mtimeMs: number;
}

export interface RemoteObject {
  key: string;
  size: number;
  etag?: string;
  uploaded?: string;
}

export function defaultConfig(overrides: Partial<SyncConfig> = {}): SyncConfig {
  return {
    dataDir: process.env.VBM_DATA_DIR || '/data',
    baseUrl: (process.env.VBM_SYNC_URL || 'http://r2.vbm').replace(/\/+$/, ''),
    fetch: (input, init) => fetch(input, init),
    log: (line) => console.log('[sync] ' + line),
    retryDelayMs: 500,
    retries: 4,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Keys and skip rules

const KEY_CHARS = /^[A-Za-z0-9._\-/ ]+$/;

export function isValidKey(key: string): boolean {
  if (!key || key.length > 512 || !KEY_CHARS.test(key)) return false;
  const parts = key.split('/');
  return parts.every((p) => p !== '' && p !== '.' && p !== '..');
}

export function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

export function decodeKey(encoded: string): string {
  return encoded.split('/').map(decodeURIComponent).join('/');
}

/**
 * Files the studio writes temporarily and must never be mirrored:
 * - `*.tmp`: meta.json.tmp, jobs/<id>.json.tmp, lyrics/<id>.json.tmp, seances/<id>.json.tmp
 *   (temp-file + rename in library.ts, jobs.ts, uploads.ts, seance.ts)
 * - `originals/decoded-<n>.flac`: transient decode output in uploads.ts, renamed or removed
 * - `*.partial`/`*.part` and any dotfile/dot-directory (includes this agent's own temp files)
 */
export function isSkipped(rel: string): boolean {
  const parts = rel.split('/');
  if (parts.some((p) => p.startsWith('.'))) return true;
  const name = parts[parts.length - 1];
  if (/\.(tmp|partial|part)$/i.test(name)) return true;
  if (/(^|\/)originals\/decoded-\d+\.flac$/.test(rel)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// HTTP with retry

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

async function withRetry<T>(cfg: SyncConfig, what: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= cfg.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      // 4xx other than 408/429 will not get better by retrying.
      if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
        if (error.status !== 408 && error.status !== 429) break;
      }
      if (attempt < cfg.retries) await sleep(cfg.retryDelayMs * 2 ** attempt);
    }
  }
  throw new Error(what + ': ' + (last instanceof Error ? last.message : String(last)));
}

async function expectOk(res: Response, what: string): Promise<Response> {
  if (!res.ok) {
    await res.body?.cancel().catch(() => {});
    throw new HttpError(res.status, what + ' -> HTTP ' + res.status);
  }
  return res;
}

export async function listRemote(cfg: SyncConfig, prefix = ''): Promise<Map<string, RemoteObject>> {
  const out = new Map<string, RemoteObject>();
  let cursor: string | undefined;
  do {
    const url =
      cfg.baseUrl +
      '/list?prefix=' +
      encodeURIComponent(prefix) +
      (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const body = await withRetry(cfg, 'list', async () => {
      const res = await expectOk(await cfg.fetch(url), 'list');
      return (await res.json()) as { objects?: RemoteObject[]; cursor?: string };
    });
    if (!body || !Array.isArray(body.objects)) throw new Error('list: malformed response');
    for (const o of body.objects) out.set(o.key, o);
    cursor = body.cursor || undefined;
  } while (cursor);
  return out;
}

async function uploadFile(cfg: SyncConfig, rel: string): Promise<void> {
  const abs = path.join(cfg.dataDir, rel);
  await withRetry(cfg, 'put ' + rel, async () => {
    const file = Bun.file(abs);
    const res = await cfg.fetch(cfg.baseUrl + '/o/' + encodeKey(rel), {
      method: 'PUT',
      body: file,
      headers: { 'content-length': String(file.size) }
    });
    await expectOk(res, 'put ' + rel);
  });
}

async function deleteKey(cfg: SyncConfig, key: string): Promise<void> {
  await withRetry(cfg, 'delete ' + key, async () => {
    const res = await cfg.fetch(cfg.baseUrl + '/o/' + encodeKey(key), { method: 'DELETE' });
    if (res.status === 404) return;
    await expectOk(res, 'delete ' + key);
  });
}

// ---------------------------------------------------------------------------
// Scan

/**
 * Walk the data dir. Throws if the root is missing/unreadable or any directory read fails
 * for a reason other than having vanished mid-walk; callers must then skip deletions.
 */
export async function scan(dataDir: string): Promise<Map<string, FileStat>> {
  const out = new Map<string, FileStat>();
  const rootStat = await stat(dataDir);
  if (!rootStat.isDirectory()) throw new Error(dataDir + ' is not a directory');
  const walk = async (rel: string): Promise<void> => {
    let entries;
    try {
      entries = await readdir(path.join(dataDir, rel), { withFileTypes: true });
    } catch (error) {
      if (rel && (error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      const childRel = rel ? rel + '/' + e.name : e.name;
      if (e.name.startsWith('.')) continue;
      if (e.isDirectory()) await walk(childRel);
      else if (e.isFile()) {
        if (isSkipped(childRel)) continue;
        try {
          const s = await stat(path.join(dataDir, childRel));
          out.set(childRel, { size: s.size, mtimeMs: s.mtimeMs });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      }
    }
  };
  await walk('');
  return out;
}

// ---------------------------------------------------------------------------
// Restore

export async function restore(
  cfg: SyncConfig
): Promise<{ downloaded: number; skipped: number; invalid: number }> {
  await mkdir(cfg.dataDir, { recursive: true });
  const remote = await listRemote(cfg);
  let downloaded = 0;
  let skipped = 0;
  let invalid = 0;
  for (const key of [...remote.keys()].sort()) {
    const obj = remote.get(key)!;
    if (!isValidKey(key)) {
      cfg.log('restore: ignoring invalid remote key ' + JSON.stringify(key));
      invalid++;
      continue;
    }
    const abs = path.join(cfg.dataDir, key);
    const local = await stat(abs).catch(() => null);
    if (local && local.isFile() && local.size === obj.size) {
      skipped++;
      continue;
    }
    await mkdir(path.dirname(abs), { recursive: true });
    const tmp = path.join(
      path.dirname(abs),
      '.vbm-sync-' + randomBytes(6).toString('hex') + '.partial'
    );
    try {
      await withRetry(cfg, 'get ' + key, async () => {
        const res = await expectOk(
          await cfg.fetch(cfg.baseUrl + '/o/' + encodeKey(key)),
          'get ' + key
        );
        await Bun.write(tmp, res);
        const got = (await stat(tmp)).size;
        if (got !== obj.size)
          throw new Error('get ' + key + ': size ' + got + ' != listed ' + obj.size);
      });
      await rename(tmp, abs);
    } catch (error) {
      await rm(tmp, { force: true });
      throw error;
    }
    downloaded++;
  }
  return { downloaded, skipped, invalid };
}

// ---------------------------------------------------------------------------
// Run state, plan and cycle

export interface SyncState {
  /** Last uploaded (or known-in-sync) local stat per key. */
  index: Map<string, FileStat>;
  /** Keys known to exist in R2 (from listing or our own uploads). */
  remote: Set<string>;
  /** Last observation of a changed-but-not-yet-uploaded file, for the stability check. */
  seen: Map<string, FileStat>;
  /** Invalid local names already logged. */
  warned: Set<string>;
}

export function newState(): SyncState {
  return { index: new Map(), remote: new Set(), seen: new Map(), warned: new Set() };
}

/** Seed state from a remote listing: remote files with the same size as local count as synced. */
export async function seedState(cfg: SyncConfig, state: SyncState): Promise<void> {
  const remote = await listRemote(cfg);
  const local = await scan(cfg.dataDir).catch(() => new Map<string, FileStat>());
  for (const [key, obj] of remote) {
    state.remote.add(key);
    const l = local.get(key);
    if (l && l.size === obj.size) state.index.set(key, l);
  }
}

const same = (a: FileStat | undefined, b: FileStat | undefined) =>
  !!a && !!b && a.size === b.size && a.mtimeMs === b.mtimeMs;

export interface Plan {
  uploads: string[];
  /** Changed files not yet stable (seen for the first time or still changing). */
  pending: string[];
  deletes: string[];
}

/**
 * Pure: decide what to do given a fresh scan. `local === null` means the scan failed,
 * so nothing is deleted. Mutates nothing; `applyObservations` records `seen`.
 */
export function plan(
  state: SyncState,
  local: Map<string, FileStat> | null,
  opts: { requireStable?: boolean } = {}
): Plan {
  const requireStable = opts.requireStable ?? true;
  const uploads: string[] = [];
  const pending: string[] = [];
  const deletes: string[] = [];
  if (!local) return { uploads, pending, deletes };
  for (const [rel, s] of local) {
    if (!isValidKey(rel)) continue;
    if (same(state.index.get(rel), s) && state.remote.has(rel)) continue;
    if (!requireStable || same(state.seen.get(rel), s)) uploads.push(rel);
    else pending.push(rel);
  }
  // Never wipe R2 because the local dir looks empty.
  if (local.size > 0) {
    for (const key of state.remote) {
      if (!local.has(key) && !isSkipped(key) && isValidKey(key)) deletes.push(key);
    }
  }
  uploads.sort();
  pending.sort();
  deletes.sort();
  return { uploads, pending, deletes };
}

export interface CycleResult {
  uploaded: number;
  deleted: number;
  pending: number;
  failed: number;
  scanFailed: boolean;
}

/** One sync round: scan, plan, upload stable changes, delete removed keys. Never throws. */
export async function runCycle(
  cfg: SyncConfig,
  state: SyncState,
  opts: { requireStable?: boolean; deadline?: number } = {}
): Promise<CycleResult> {
  const result: CycleResult = { uploaded: 0, deleted: 0, pending: 0, failed: 0, scanFailed: false };
  let local: Map<string, FileStat> | null;
  try {
    local = await scan(cfg.dataDir);
  } catch (error) {
    cfg.log('scan failed, skipping this round: ' + (error as Error).message);
    result.scanFailed = true;
    return result;
  }
  for (const rel of local.keys()) {
    if (!isValidKey(rel) && !state.warned.has(rel)) {
      state.warned.add(rel);
      cfg.log('skipping file with unsupported name: ' + JSON.stringify(rel));
    }
  }
  const p = plan(state, local, opts);
  for (const rel of p.pending) state.seen.set(rel, local.get(rel)!);
  result.pending = p.pending.length;
  const late = () => opts.deadline !== undefined && Date.now() > opts.deadline;

  for (const rel of p.uploads) {
    if (late()) {
      result.pending++;
      continue;
    }
    const before = local.get(rel)!;
    try {
      await uploadFile(cfg, rel);
      const after = await stat(path.join(cfg.dataDir, rel)).catch(() => null);
      state.seen.delete(rel);
      if (after && after.size === before.size && after.mtimeMs === before.mtimeMs) {
        state.index.set(rel, before);
        state.remote.add(rel);
        result.uploaded++;
      } else {
        // Changed during upload: R2 has some version; retry next round.
        state.remote.add(rel);
        state.index.delete(rel);
        result.pending++;
      }
    } catch (error) {
      result.failed++;
      cfg.log('upload failed ' + rel + ': ' + (error as Error).message);
    }
  }
  for (const key of p.deletes) {
    if (late()) break;
    try {
      await deleteKey(cfg, key);
      state.remote.delete(key);
      state.index.delete(key);
      state.seen.delete(key);
      result.deleted++;
    } catch (error) {
      result.failed++;
      cfg.log('delete failed ' + key + ': ' + (error as Error).message);
    }
  }
  for (const rel of [...state.seen.keys()]) if (!local.has(rel)) state.seen.delete(rel);
  return result;
}

/**
 * Final flush on shutdown: scan twice (settle interval apart) so files that stopped changing
 * count as stable, then upload them and apply deletes, bounded by `budgetMs`.
 */
export async function flush(
  cfg: SyncConfig,
  state: SyncState,
  opts: { budgetMs?: number; settleMs?: number } = {}
): Promise<CycleResult> {
  const deadline = Date.now() + (opts.budgetMs ?? 25_000);
  const first = await runCycle(cfg, state, { deadline });
  if (first.scanFailed || first.pending === 0) return first;
  await sleep(opts.settleMs ?? 1000);
  const second = await runCycle(cfg, state, { deadline });
  return {
    uploaded: first.uploaded + second.uploaded,
    deleted: first.deleted + second.deleted,
    pending: second.pending,
    failed: first.failed + second.failed,
    scanFailed: second.scanFailed
  };
}

// ---------------------------------------------------------------------------
// CLI

async function runForever(cfg: SyncConfig): Promise<void> {
  const state = newState();
  await withRetry(cfg, 'initial listing', () => seedState(cfg, state)).catch((error) => {
    cfg.log('initial listing failed, deletions disabled until a listing succeeds: ' + error);
  });
  let chain: Promise<unknown> = Promise.resolve();
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let stopping = false;
  const cycle = () => {
    chain = chain.then(async () => {
      if (stopping) return;
      const r = await runCycle(cfg, state);
      if (r.uploaded || r.deleted || r.failed)
        cfg.log(
          `cycle: ${r.uploaded} up, ${r.deleted} del, ${r.pending} pending, ${r.failed} failed`
        );
      if (r.pending || r.failed) schedule();
    });
  };
  const schedule = () => {
    if (stopping) return;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(cycle, 2000);
  };
  let watcher: FSWatcher | undefined;
  try {
    watcher = watch(cfg.dataDir, { recursive: true }, () => schedule());
    watcher.on('error', (e) => cfg.log('watch error (scan fallback continues): ' + e));
  } catch (error) {
    cfg.log('watch unavailable, relying on 30 s scans: ' + (error as Error).message);
  }
  const interval = setInterval(cycle, 30_000);
  cycle();

  const shutdown = async (sig: string) => {
    if (stopping) return;
    stopping = true;
    cfg.log(sig + ': final flush');
    watcher?.close();
    clearInterval(interval);
    if (debounce) clearTimeout(debounce);
    const hard = setTimeout(() => process.exit(0), 28_000);
    await chain.catch(() => {});
    const r = await flush(cfg, state, { budgetMs: 25_000 });
    cfg.log(`final: ${r.uploaded} up, ${r.deleted} del, ${r.pending} left, ${r.failed} failed`);
    clearTimeout(hard);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

async function main(): Promise<void> {
  const cfg = defaultConfig();
  const cmd = process.argv[2];
  if (cmd === 'restore') {
    try {
      const r = await restore(cfg);
      cfg.log(
        `restore ok: ${r.downloaded} downloaded, ${r.skipped} up to date, ${r.invalid} invalid keys ignored`
      );
    } catch (error) {
      cfg.log('restore FAILED: ' + (error as Error).message);
      process.exit(1);
    }
  } else if (cmd === 'run') {
    await runForever(cfg);
  } else {
    console.error('usage: bun sync-agent.ts restore|run');
    process.exit(2);
  }
}

if (import.meta.main) void main();
