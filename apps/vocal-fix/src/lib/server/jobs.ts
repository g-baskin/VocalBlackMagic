import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { VocalFixError } from './errors';

const persistFailed = (id: string) => (error: unknown) =>
  console.error(
    'Vocal Fix job',
    id,
    'status not saved:',
    error instanceof Error ? error.message : error
  );

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StageState = 'pending' | 'active' | 'done' | 'failed';

export interface Job {
  id: string;
  session_id: string;
  kind: 'repair' | 'forge';
  status: JobStatus;
  stages: { id: string; label: string; state: StageState }[];
  detail: string;
  created_at: string;
  updated_at: string;
  result?: Record<string, unknown>;
  error?: string;
}

export const JOB_ID = /^job-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const RESTART_ERROR = 'failed: interrupted by restart';

export interface JobContext {
  signal: AbortSignal;
  stage(id: string, state: StageState, detail?: string): Promise<void>;
  detail(text: string): Promise<void>;
}

type Work = (ctx: JobContext) => Promise<Record<string, unknown>>;
interface Live {
  job: Job;
  ctrl: AbortController;
  work: Work;
}

export interface JobLimits {
  maxRunning: number;
  maxForge: number;
}

/**
 * Async jobs persisted as <data>/vocal-fix/jobs/<id>.json so status survives a restart.
 * At most `maxRunning` jobs run at once (and `maxForge` forges); the rest wait as 'queued'.
 */
export class JobRunner {
  private readonly live = new Map<string, Live>();
  private readonly order: string[] = [];

  constructor(
    readonly dir: string,
    private readonly now: () => Date = () => new Date(),
    private readonly limits: JobLimits = { maxRunning: 2, maxForge: 1 }
  ) {}

  private path(id: string): string {
    if (!JOB_ID.test(id)) throw new VocalFixError('Unknown job.', 404);
    return join(this.dir, id + '.json');
  }

  private async persist(job: Job): Promise<void> {
    job.updated_at = this.now().toISOString();
    await mkdir(this.dir, { recursive: true });
    const target = this.path(job.id);
    const tmp = target + '.' + randomUUID() + '.tmp';
    await writeFile(tmp, JSON.stringify(job, null, 2));
    await rename(tmp, target);
  }

  /** Call once at startup: any job left queued/running on disk was interrupted. */
  async recover(): Promise<number> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return 0;
    }
    let n = 0;
    for (const name of names.sort()) {
      const id = name.replace(/\.json$/, '');
      if (!name.endsWith('.json') || !JOB_ID.test(id) || this.live.has(id)) continue;
      try {
        const job = JSON.parse(await readFile(this.path(id), 'utf8')) as Job;
        if (job.status !== 'queued' && job.status !== 'running') continue;
        job.status = 'failed';
        job.error = RESTART_ERROR;
        job.detail = RESTART_ERROR;
        for (const s of job.stages) if (s.state === 'active') s.state = 'failed';
        await this.persist(job);
        n++;
      } catch {
        /* unreadable job file: leave it */
      }
    }
    return n;
  }

  async start(
    _sessionDir: string,
    sessionId: string,
    kind: Job['kind'],
    stages: { id: string; label: string }[],
    work: Work
  ): Promise<Job> {
    const at = this.now().toISOString();
    const job: Job = {
      id: 'job-' + randomUUID(),
      session_id: sessionId,
      kind,
      status: 'queued',
      stages: stages.map((s) => ({ ...s, state: 'pending' })),
      detail: 'Queued',
      created_at: at,
      updated_at: at
    };
    this.live.set(job.id, { job, ctrl: new AbortController(), work });
    this.order.push(job.id);
    await this.persist(job);
    queueMicrotask(() => this.pump());
    return job;
  }

  private running(kind?: Job['kind']): number {
    let n = 0;
    for (const l of this.live.values())
      if (l.job.status === 'running' && (!kind || l.job.kind === kind)) n++;
    return n;
  }

  private pump(): void {
    for (const id of [...this.order]) {
      if (this.running() >= this.limits.maxRunning) return;
      const l = this.live.get(id);
      if (!l || l.job.status !== 'queued') continue;
      if (l.job.kind === 'forge' && this.running('forge') >= this.limits.maxForge) continue;
      this.order.splice(this.order.indexOf(id), 1);
      this.run(l);
    }
  }

  private run(l: Live): void {
    const { job, ctrl } = l;
    job.status = 'running';
    job.detail = 'Running';
    const ctx: JobContext = {
      signal: ctrl.signal,
      stage: async (id, state, detail) => {
        const s = job.stages.find((x) => x.id === id);
        if (s) s.state = state;
        if (detail) job.detail = detail;
        await this.persist(job);
      },
      detail: async (text) => {
        job.detail = text;
        await this.persist(job);
      }
    };
    void this.persist(job)
      .then(() => l.work(ctx))
      .then((result) => {
        job.status = 'completed';
        job.result = result;
        job.detail = 'Complete';
      })
      .catch((error: unknown) => {
        const cancelled = ctrl.signal.aborted;
        job.status = cancelled ? 'cancelled' : 'failed';
        if (!cancelled)
          console.error(
            'Vocal Fix job',
            job.id,
            job.kind,
            'failed:',
            error instanceof VocalFixError ? error.message : error
          );
        job.error = cancelled
          ? 'Cancelled by user.'
          : error instanceof VocalFixError
            ? error.message
            : 'Processing failed.';
        job.detail = job.error;
        for (const s of job.stages) if (s.state === 'active') s.state = 'failed';
      })
      .finally(async () => {
        await this.persist(job).catch(persistFailed(job.id));
        this.live.delete(job.id);
        this.pump();
      });
  }

  async get(_sessionDir: string, id: string): Promise<Job> {
    const live = this.live.get(id);
    if (live) return live.job;
    try {
      return JSON.parse(await readFile(this.path(id), 'utf8')) as Job;
    } catch {
      throw new VocalFixError('Unknown job.', 404);
    }
  }

  cancel(sessionId: string, id: string): boolean {
    const l = this.live.get(id);
    if (!l || l.job.session_id !== sessionId) return false;
    l.ctrl.abort();
    if (l.job.status === 'queued') {
      this.order.splice(this.order.indexOf(id), 1);
      l.job.status = 'cancelled';
      l.job.error = 'Cancelled by user.';
      l.job.detail = l.job.error;
      this.live.delete(id);
      void this.persist(l.job).catch(persistFailed(l.job.id));
    }
    return true;
  }

  cancelSession(sessionId: string): void {
    for (const l of [...this.live.values()])
      if (l.job.session_id === sessionId) this.cancel(sessionId, l.job.id);
  }

  /** Delete the job records belonging to one session (used when the session is deleted). */
  async removeSession(sessionId: string): Promise<void> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch {
      return;
    }
    for (const name of names) {
      const id = name.replace(/\.json$/, '');
      if (!name.endsWith('.json') || !JOB_ID.test(id)) continue;
      try {
        const job = JSON.parse(await readFile(this.path(id), 'utf8')) as Job;
        if (job.session_id === sessionId) await rm(this.path(id), { force: true });
      } catch {
        /* skip */
      }
    }
  }

  async idle(sessionId: string, timeoutMs = 10_000): Promise<void> {
    const end = Date.now() + timeoutMs;
    while ([...this.live.values()].some((l) => l.job.session_id === sessionId) && Date.now() < end)
      await new Promise((r) => setTimeout(r, 20));
  }
}
