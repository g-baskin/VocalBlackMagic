import { mkdir, readdir, readFile, rename, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  stemNames,
  type JobStage,
  type SongKind,
  type SongMeta,
  type StemName,
  type StoredAudio,
  type StudioJob,
  type StudioJobKind
} from '@vbm/contracts';
import { verifiedAudioResponse } from '../music/audio';
import { ProviderError } from '../music/errors';
import { falAudioUrl, falStatus, type FalDeps } from '../music/fal';
import { conjureCover, inheritCover } from './cover';
import { extensionFor, isSongId, type SongLibrary } from './library';
import {
  cancelPrediction,
  createPrediction,
  getPrediction,
  isOutputRef,
  outputResponse,
  type ReplicateDeps,
  type ReplicateModel
} from './replicate';

/** Everything needed to write a finished song's meta.json. */
export interface SongPlan {
  title: string;
  prompt: string;
  style_tags: string[];
  lyrics: string | null;
  engine: string;
  params: SongMeta['params'];
  parent_id: string | null;
  kind: SongKind;
  est_cost_usd: number;
  voice?: SongMeta['voice'];
}

export interface JobTask {
  provider: 'replicate' | 'fal';
  prediction_id: string;
  take: number;
  status: 'running' | 'stored' | 'failed' | 'canceled';
  song_id?: string;
  error?: string;
}

export interface JobRecord extends StudioJob {
  tasks: JobTask[];
  plan: SongPlan;
  deadline_at: string;
}

export interface JobContext {
  library: SongLibrary;
  replicate: ReplicateDeps | null;
  fal: FalDeps | null;
  fetch: typeof fetch;
  now: () => Date;
}

const jobIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const jobTimeoutMs = 20 * 60_000;
const staleLockMs = 10 * 60_000;

export const isJobId = (id: string) => jobIdPattern.test(id);
const jobsDir = (ctx: JobContext) => path.join(ctx.library.root, 'studio', 'jobs');
const jobFile = (ctx: JobContext, id: string) => {
  if (!isJobId(id)) throw new ProviderError(404, 'Job not found.');
  return path.join(jobsDir(ctx), id + '.json');
};

const stageLabels: Record<StudioJobKind, [string, string][]> = {
  create: [
    ['summon', 'Summoning the song'],
    ['bind', 'Binding audio to the library']
  ],
  reimagine: [
    ['upload', 'Offering the reference'],
    ['summon', 'Reimagining'],
    ['bind', 'Binding audio to the library']
  ],
  stems: [
    ['upload', 'Offering the song'],
    ['summon', 'Splitting into stems'],
    ['bind', 'Binding stems to the library']
  ],
  voice: [
    ['upload', 'Offering the song'],
    ['summon', 'Singing in the chosen voice'],
    ['bind', 'Binding audio to the library']
  ]
};

function stages(kind: StudioJobKind, active: string): JobStage[] {
  const list = stageLabels[kind];
  const index = list.findIndex(([id]) => id === active);
  return list.map(([id, label], i) => ({
    id,
    label,
    state: i < index ? 'done' : i === index ? 'active' : 'pending'
  }));
}

async function saveJob(ctx: JobContext, job: JobRecord): Promise<void> {
  await mkdir(jobsDir(ctx), { recursive: true });
  const file = jobFile(ctx, job.id);
  await writeFile(file + '.tmp', JSON.stringify(job, null, 2));
  await rename(file + '.tmp', file);
}

export async function loadJob(ctx: JobContext, id: string): Promise<JobRecord> {
  try {
    return JSON.parse(await readFile(jobFile(ctx, id), 'utf8')) as JobRecord;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(404, 'Job not found.');
  }
}

export function publicJob(job: JobRecord): StudioJob {
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    stages: job.stages,
    ...(job.detail ? { detail: job.detail } : {}),
    song_ids: job.song_ids,
    created_at: job.created_at,
    updated_at: job.updated_at
  };
}

export const maxActiveJobs = 3;

/** Paid work is refused while too many jobs are still running (a runaway-spend guard). */
export async function assertJobCapacity(ctx: JobContext): Promise<void> {
  let names: string[];
  try {
    names = await readdir(jobsDir(ctx));
  } catch {
    return;
  }
  let active = 0;
  const now = ctx.now().toISOString();
  for (const name of names) {
    if (!name.endsWith('.json') || !isJobId(name.slice(0, -5))) continue;
    try {
      const job = JSON.parse(await readFile(path.join(jobsDir(ctx), name), 'utf8')) as JobRecord;
      if (job.status === 'running' && job.deadline_at > now) active += 1;
    } catch {
      // unreadable job files do not count
    }
  }
  if (active >= maxActiveJobs)
    throw new ProviderError(
      429,
      'Already ' + active + ' rituals in progress. Wait for one to finish before starting another.'
    );
}

/** Records a job whose provider work has already been submitted. */
export async function recordJob(
  ctx: JobContext,
  kind: StudioJobKind,
  plan: SongPlan,
  tasks: JobTask[]
): Promise<JobRecord> {
  const now = ctx.now();
  const job: JobRecord = {
    id: crypto.randomUUID(),
    kind,
    status: 'running',
    stages: stages(kind, 'summon'),
    song_ids: [],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    tasks,
    plan,
    deadline_at: new Date(now.getTime() + jobTimeoutMs).toISOString()
  };
  await saveJob(ctx, job);
  return job;
}

/** Records a job that finished synchronously (for example Lyria 3.5 returning audio inline). */
export async function recordFinishedJob(
  ctx: JobContext,
  kind: StudioJobKind,
  plan: SongPlan,
  songIds: string[]
) {
  const job = await recordJob(ctx, kind, plan, []);
  job.status = 'completed';
  job.song_ids = songIds;
  job.stages = job.stages.map((s) => ({ ...s, state: 'done' }));
  await saveJob(ctx, job);
  return job;
}

export async function submitReplicateTasks(
  deps: ReplicateDeps,
  model: ReplicateModel,
  inputs: Record<string, unknown>[]
): Promise<JobTask[]> {
  const tasks: JobTask[] = [];
  for (const [take, input] of inputs.entries()) {
    try {
      const prediction = await createPrediction(deps, model, input);
      tasks.push({
        provider: 'replicate',
        prediction_id: prediction.id,
        take: take + 1,
        status: 'running'
      });
    } catch (error) {
      // A first take that already started is kept; only fail when nothing was submitted.
      if (tasks.length === 0) throw error;
      break;
    }
  }
  return tasks;
}

async function writeVerified(response: Response, dir: string, base: string): Promise<StoredAudio> {
  const verified = await verifiedAudioResponse(response);
  const contentType = verified.headers.get('content-type') ?? 'application/octet-stream';
  const relative = base + '.' + extensionFor(contentType);
  const target = path.join(dir, relative);
  try {
    const data = new Uint8Array(await verified.arrayBuffer());
    await writeFile(target, data);
    const bytes = data.length;
    return { file: relative, content_type: contentType, bytes };
  } catch (error) {
    await rm(target, { force: true });
    throw new ProviderError(
      502,
      'The audio download was incomplete.',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/** Stores a verified audio response as a new library song built from the plan. */
export async function storeSong(
  ctx: JobContext,
  plan: SongPlan,
  take: number,
  main: Response | null,
  stems: Partial<Record<StemName, Response>> = {}
): Promise<SongMeta> {
  const { id, dir } = await ctx.library.reserve();
  try {
    const audio = main ? await writeVerified(main, dir, 'audio') : null;
    const stored: NonNullable<SongMeta['stems']> = [];
    for (const name of stemNames) {
      const response = stems[name];
      if (response) stored.push({ name, ...(await writeVerified(response, dir, 'stems/' + name)) });
    }
    const cover = await inheritCover(ctx.library, plan.parent_id, dir);
    const meta: SongMeta = {
      id,
      title: plan.title + (take > 1 ? ' (take ' + take + ')' : ''),
      prompt: plan.prompt,
      style_tags: plan.style_tags,
      lyrics: plan.lyrics,
      engine: plan.engine,
      params: { ...plan.params, take },
      created_at: ctx.now().toISOString(),
      parent_id: plan.parent_id,
      kind: plan.kind,
      favourite: false,
      audio,
      ...(stored.length ? { stems: stored } : {}),
      ...(plan.voice ? { voice: plan.voice } : {}),
      ...(cover ? { cover } : {}),
      est_cost_usd: plan.est_cost_usd
    };
    await ctx.library.save(meta);
    return meta;
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

async function storeReplicateOutput(
  ctx: JobContext,
  job: JobRecord,
  task: JobTask,
  output: unknown
): Promise<SongMeta> {
  if (job.kind === 'stems') {
    const record = (output ?? {}) as Record<string, unknown>;
    const responses: Partial<Record<StemName, Response>> = {};
    for (const name of stemNames) {
      const url = record[name];
      if (!isOutputRef(url))
        throw new ProviderError(502, 'Demucs did not return the ' + name + ' stem.');
      responses[name] = await outputResponse(ctx.fetch, url);
    }
    return storeSong(ctx, job.plan, 1, null, responses);
  }
  const url = Array.isArray(output) ? output[0] : output;
  if (!isOutputRef(url))
    throw new ProviderError(
      502,
      'The model returned an unexpected audio location.',
      'output url rejected'
    );
  return storeSong(ctx, job.plan, task.take, await outputResponse(ctx.fetch, url));
}

async function advanceTask(ctx: JobContext, job: JobRecord, task: JobTask): Promise<void> {
  if (task.provider === 'replicate') {
    if (!ctx.replicate) throw new ProviderError(503, 'REPLICATE_API_TOKEN is not configured.');
    const prediction = await getPrediction(ctx.replicate, task.prediction_id);
    if (prediction.status === 'succeeded') {
      job.stages = stages(job.kind, 'bind');
      const meta = await storeReplicateOutput(ctx, job, task, prediction.output);
      task.status = 'stored';
      task.song_id = meta.id;
      await maybeCover(ctx, job, meta.id);
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      task.status = prediction.status === 'failed' ? 'failed' : 'canceled';
      task.error = prediction.error ?? 'The model could not finish.';
      console.error('Replicate prediction', prediction.id, prediction.status, task.error);
    }
    return;
  }
  if (!ctx.fal) throw new ProviderError(503, 'FAL_KEY is not configured.');
  const { status, detail } = await falStatus(ctx.fal, task.prediction_id);
  if (status === 'failed') {
    task.status = 'failed';
    task.error = detail ?? 'The provider could not generate this song.';
  } else if (status === 'completed') {
    const url = await falAudioUrl(ctx.fal, task.prediction_id);
    const meta = await storeSong(
      ctx,
      job.plan,
      task.take,
      await ctx.fetch(url, { redirect: 'error', signal: AbortSignal.timeout(180_000) })
    );
    task.status = 'stored';
    task.song_id = meta.id;
    await maybeCover(ctx, job, meta.id);
  }
}

/** New originals get cover art when asked; a cover failure never fails the song. */
export async function maybeCover(ctx: JobContext, job: JobRecord, songId: string): Promise<void> {
  if (job.kind !== 'create' || job.plan.params.cover !== true || !ctx.replicate) return;
  try {
    await conjureCover(ctx.library, ctx.replicate, songId);
  } catch (error) {
    console.error(
      'Cover art failed for',
      songId,
      error instanceof ProviderError ? (error.logDetail ?? error.publicMessage) : error
    );
  }
}

function settle(job: JobRecord): void {
  job.song_ids = job.tasks.flatMap((t) => (t.song_id ? [t.song_id] : []));
  if (job.tasks.some((t) => t.status === 'running')) return;
  if (job.song_ids.length > 0) {
    job.status = 'completed';
    job.stages = job.stages.map((s) => ({ ...s, state: 'done' }));
    const failed = job.tasks.filter((t) => t.status !== 'stored').length;
    if (failed)
      job.detail =
        failed + ' take(s) failed: ' + (job.tasks.find((t) => t.error)?.error ?? 'unknown error');
  } else {
    job.status = job.tasks.every((t) => t.status === 'canceled') ? 'canceled' : 'failed';
    job.stages = job.stages.map((s) => (s.state === 'active' ? { ...s, state: 'failed' } : s));
    job.detail =
      job.status === 'canceled'
        ? 'Canceled.'
        : 'The model could not finish: ' +
          (job.tasks.find((t) => t.error)?.error ?? 'unknown error');
  }
}

async function withLock<T>(ctx: JobContext, id: string, fn: () => Promise<T>): Promise<T | null> {
  const lock = jobFile(ctx, id) + '.lock';
  try {
    await mkdir(lock);
  } catch {
    const info = await stat(lock).catch(() => null);
    if (info && ctx.now().getTime() - info.mtimeMs < staleLockMs) return null;
    await rmdir(lock).catch(() => undefined);
    try {
      await mkdir(lock);
    } catch {
      return null;
    }
  }
  try {
    return await fn();
  } finally {
    await rmdir(lock).catch(() => undefined);
  }
}

/** Polls providers once and stores any finished audio. Safe to call repeatedly and concurrently. */
export async function advanceJob(ctx: JobContext, id: string): Promise<StudioJob> {
  const current = await loadJob(ctx, id);
  if (current.status !== 'running' && current.status !== 'queued') return publicJob(current);
  const updated = await withLock(ctx, id, async () => {
    const job = await loadJob(ctx, id);
    if (job.status !== 'running') return job;
    for (const task of job.tasks.filter((t) => t.status === 'running')) {
      try {
        await advanceTask(ctx, job, task);
      } catch (error) {
        // Transient polling errors keep the task running; storage or verification errors fail it.
        const transient =
          error instanceof ProviderError &&
          (error.status === 429 || error.status === 503 || error.status === 504);
        const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
        if (!transient && !timedOut) {
          task.status = 'failed';
          task.error =
            error instanceof ProviderError ? error.publicMessage : 'Storing the audio failed.';
          console.error(
            'Studio job task failed:',
            error instanceof ProviderError ? (error.logDetail ?? error.publicMessage) : error
          );
        }
      }
    }
    if (ctx.now().toISOString() > job.deadline_at) {
      for (const task of job.tasks.filter((t) => t.status === 'running')) {
        if (task.provider === 'replicate' && ctx.replicate)
          await cancelPrediction(ctx.replicate, task.prediction_id).catch(() => undefined);
        task.status = 'failed';
        task.error = 'Timed out after 20 minutes.';
      }
    }
    settle(job);
    job.updated_at = ctx.now().toISOString();
    await saveJob(ctx, job);
    return job;
  });
  return publicJob(updated ?? current);
}

export async function cancelJob(ctx: JobContext, id: string): Promise<StudioJob> {
  const result = await withLock(ctx, id, async () => {
    const job = await loadJob(ctx, id);
    if (job.status !== 'running') return job;
    for (const task of job.tasks.filter((t) => t.status === 'running')) {
      if (task.provider === 'replicate' && ctx.replicate)
        await cancelPrediction(ctx.replicate, task.prediction_id);
      task.status = 'canceled';
      task.error = 'Canceled.';
    }
    settle(job);
    job.updated_at = ctx.now().toISOString();
    await saveJob(ctx, job);
    return job;
  });
  if (!result)
    throw new ProviderError(409, 'The job is busy storing audio; try again in a moment.');
  return publicJob(result);
}

export { isSongId };
