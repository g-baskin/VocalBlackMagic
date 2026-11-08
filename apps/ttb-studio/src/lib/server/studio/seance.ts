import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  seanceLabels,
  type CreateSongRequest,
  type JobStage,
  type Seance,
  type SeanceEntry,
  type SeanceLabel,
  type SeanceLeaderRow,
  type SeanceRequest,
  type StudioJob,
  type StudioModel,
  type StudioModelInfo
} from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import type { CreateResult } from './create';

/**
 * The Séance: one take per model on the same prompt and lyrics, labelled A to D in a shuffled
 * order. The model and runner of each take stay on the server until the user ranks the takes.
 * Paid work goes through createSongs (one call per model), so its gates and job cap still apply.
 */

/** What a stored entry knows; model and runner never leave the server before the reveal. */
export interface StoredEntry {
  label: SeanceLabel;
  model: StudioModel;
  runner: string | null;
  job_id: string | null;
  /** Set when submitting this take failed; the entry is kept and reported, not dropped. */
  error: string | null;
  rank: number | null;
}

export interface StoredSeance {
  id: string;
  prompt: string;
  lyrics: string | null;
  title: string;
  instrumental: boolean;
  created_at: string;
  revealed: boolean;
  ranking: SeanceLabel[] | null;
  entries: StoredEntry[];
}

export interface SeanceDeps {
  /** Data dir (the library root); séances live in <root>/studio/seances. */
  root: string;
  now: () => Date;
  /** 0 <= x < 1; injected so tests can fix the shuffle. */
  random: () => number;
  capabilities: () => Promise<StudioModelInfo[]>;
  /** Writes lyrics once for every take. Null when no lyricist is configured. */
  writeLyrics: ((prompt: string) => Promise<{ lyrics: string; title: string | null }>) | null;
  /** createSongs with the séance's id (tags the takes, lifts the job cap to 4 for them). */
  create: (request: CreateSongRequest, options: { seanceId: string }) => Promise<CreateResult>;
  advance: (jobId: string) => Promise<StudioJob>;
  /** The runner that took a job (read from the job record). */
  jobRunner: (jobId: string) => Promise<string | null>;
}

export class SeanceRefused extends ProviderError {
  constructor(readonly refused: { model: StudioModel; reason: string }[]) {
    super(
      422,
      'The comparison cannot start: ' +
        refused.map((r) => r.model + ' ' + r.reason).join('; ') +
        '.'
    );
  }
}

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Length requested for every séance take (models that pick their own length ignore it). */
export const seanceSeconds = 60;
export const isSeanceId = (id: string) => idPattern.test(id);
const dir = (deps: Pick<SeanceDeps, 'root'>) => path.join(deps.root, 'studio', 'seances');
function file(deps: Pick<SeanceDeps, 'root'>, id: string, suffix = '.json'): string {
  if (!isSeanceId(id)) throw new ProviderError(404, 'Comparison not found.');
  return path.join(dir(deps), id + suffix);
}

/** Fisher-Yates over the first n labels. */
export function shuffledLabels(n: number, random: () => number): SeanceLabel[] {
  const labels = seanceLabels.slice(0, n) as SeanceLabel[];
  for (let i = labels.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  return labels;
}

/** Why each model cannot take part, from the live capabilities. Empty when all can. */
export function refusals(
  infos: StudioModelInfo[],
  models: StudioModel[],
  instrumental: boolean
): { model: StudioModel; reason: string }[] {
  const out: { model: StudioModel; reason: string }[] = [];
  for (const model of models) {
    const info = infos.find((i) => i.id === model);
    if (!info) out.push({ model, reason: 'is not a known model' });
    else if (!info.active_runner)
      out.push({
        model,
        reason:
          'has no ready runner (' + (info.runners.map((r) => r.status).join(', ') || 'none') + ')'
      });
    else if (instrumental && !info.instrumental)
      out.push({ model, reason: 'cannot make instrumentals' });
    else if (!instrumental && !info.vocals) out.push({ model, reason: 'makes instrumentals only' });
  }
  return out;
}

async function save(deps: Pick<SeanceDeps, 'root'>, seance: StoredSeance): Promise<void> {
  await mkdir(dir(deps), { recursive: true });
  const target = file(deps, seance.id);
  await writeFile(target + '.tmp', JSON.stringify(seance, null, 2));
  await rename(target + '.tmp', target);
}

export async function loadSeance(
  deps: Pick<SeanceDeps, 'root'>,
  id: string
): Promise<StoredSeance> {
  const target = file(deps, id);
  try {
    return JSON.parse(await readFile(target, 'utf8')) as StoredSeance;
  } catch {
    throw new ProviderError(404, 'Comparison not found.');
  }
}

export async function startSeance(deps: SeanceDeps, request: SeanceRequest): Promise<Seance> {
  const instrumental = request.instrumental === true;
  const refused = refusals(await deps.capabilities(), request.models, instrumental);
  if (refused.length) throw new SeanceRefused(refused);

  let lyrics = instrumental ? null : request.lyrics?.trim() || null;
  let title = request.title?.trim() ?? '';
  const allWriteOwn = request.models.every((m) => m === 'lyria-3-pro');
  if (!instrumental && !lyrics && !allWriteOwn) {
    if (!deps.writeLyrics)
      throw new ProviderError(
        503,
        'Writing shared lyrics needs a lyricist key (Anthropic, OpenAI, Gemini or Replicate). Paste your own lyrics instead.'
      );
    const written = await deps.writeLyrics(request.prompt);
    lyrics = written.lyrics;
    if (!title && written.title) title = written.title;
  }
  if (!title) title = 'Comparison';

  const labels = shuffledLabels(request.models.length, deps.random);
  const seance: StoredSeance = {
    id: randomUUID(),
    prompt: request.prompt.trim(),
    lyrics,
    title,
    instrumental,
    created_at: deps.now().toISOString(),
    revealed: false,
    ranking: null,
    entries: request.models
      .map((model, i) => ({
        label: labels[i],
        model,
        runner: null,
        job_id: null,
        error: null,
        rank: null
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  };
  // Persist before any paid submission, and after each one, so a failed write can never leave
  // paid takes without a séance record (they would stay sealed and unrankable).
  await save(deps, seance);
  for (const entry of seance.entries) {
    try {
      const result = await deps.create(
        {
          mode: 'custom',
          prompt: seance.prompt,
          title: title + ' · ' + entry.label,
          lyrics,
          style_tags: [],
          instrumental,
          engine: 'minimax-music-1.5',
          model: entry.model,
          // Same, short length for every take: a fair comparison, and GPU-billed runners cost less.
          duration_seconds: seanceSeconds,
          sound_character: 'raw',
          takes: 1,
          cover: false
        },
        { seanceId: seance.id }
      );
      entry.job_id = result.job.id;
      entry.runner = await deps.jobRunner(result.job.id).catch(() => null);
    } catch (error) {
      entry.error = error instanceof ProviderError ? error.publicMessage : 'Generation failed.';
    }
    await save(deps, seance);
  }
  return view(seance, new Map());
}

/**
 * Before the reveal a failed take shows every stage as failed: which stage a failure stopped at
 * can differ by runner (how each provider's audio is fetched and stored), so it could hint at
 * the model.
 */
function sealedStages(list: JobStage[]): JobStage[] {
  return list.map((stage) => ({ ...stage, state: 'failed' }));
}

/** The public shape: model and runner only once revealed; failure details hidden until then. */
export function view(seance: StoredSeance, jobs: Map<string, StudioJob>): Seance {
  const entries: SeanceEntry[] = seance.entries.map((e) => {
    const job = e.job_id ? jobs.get(e.job_id) : undefined;
    const failed = !!e.error || job?.status === 'failed' || job?.status === 'canceled';
    const out: SeanceEntry = {
      label: e.label,
      status: e.error ? 'failed' : (job?.status ?? 'running'),
      stages: seance.revealed || !failed ? (job?.stages ?? []) : sealedStages(job?.stages ?? []),
      song_id: job?.status === 'completed' ? (job.song_ids[0] ?? null) : null,
      rank: e.rank
    };
    if (failed)
      out.detail = seance.revealed
        ? (e.error ?? job?.detail ?? 'This take failed.')
        : 'This take failed.';
    if (seance.revealed) {
      out.model = e.model;
      if (e.runner) out.runner = e.runner;
    }
    return out;
  });
  return {
    id: seance.id,
    prompt: seance.prompt,
    lyrics: seance.lyrics,
    instrumental: seance.instrumental,
    created_at: seance.created_at,
    revealed: seance.revealed,
    ranking: seance.ranking,
    entries
  };
}

async function jobsFor(deps: SeanceDeps, seance: StoredSeance): Promise<Map<string, StudioJob>> {
  const jobs = new Map<string, StudioJob>();
  for (const e of seance.entries)
    if (e.job_id) {
      try {
        jobs.set(e.job_id, await deps.advance(e.job_id));
      } catch {
        // a missing job reads as still running; it times out through the job itself
      }
    }
  return jobs;
}

export async function getSeance(deps: SeanceDeps, id: string): Promise<Seance> {
  const seance = await loadSeance(deps, id);
  return view(seance, await jobsFor(deps, seance));
}

/** Ranks the finished takes (labels best to worst) and reveals every entry. Only once. */
export async function rankSeance(
  deps: SeanceDeps,
  id: string,
  order: SeanceLabel[]
): Promise<Seance> {
  const seance = await loadSeance(deps, id);
  if (seance.revealed) throw new ProviderError(409, 'This comparison is already revealed.');
  const jobs = await jobsFor(deps, seance);
  const current = view(seance, jobs);
  if (current.entries.some((e) => e.status === 'running' || e.status === 'queued'))
    throw new ProviderError(409, 'Wait until every take has finished.');
  const rankable = current.entries.filter((e) => e.song_id).map((e) => e.label);
  if (rankable.length < 2)
    throw new ProviderError(409, 'Fewer than two takes finished, so there is nothing to rank.');
  if (order.length !== rankable.length || !rankable.every((l) => order.includes(l)))
    throw new ProviderError(422, 'Rank exactly the finished takes: ' + rankable.join(', ') + '.');
  // The lock file is created exclusively, so two concurrent rankings cannot both win.
  try {
    await writeFile(file(deps, id, '.ranked'), order.join(','), { flag: 'wx' });
  } catch {
    throw new ProviderError(409, 'This comparison is already revealed.');
  }
  try {
    for (const e of seance.entries) {
      const at = order.indexOf(e.label);
      e.rank = at >= 0 ? at + 1 : null;
      if (e.job_id && !e.runner) e.runner = await deps.jobRunner(e.job_id).catch(() => null);
    }
    seance.ranking = order;
    seance.revealed = true;
    await save(deps, seance);
  } catch (error) {
    await rm(file(deps, id, '.ranked'), { force: true });
    throw error;
  }
  return view(seance, jobs);
}

async function allStored(deps: Pick<SeanceDeps, 'root'>): Promise<StoredSeance[]> {
  let names: string[];
  try {
    names = await readdir(dir(deps));
  } catch {
    return [];
  }
  const out: StoredSeance[] = [];
  for (const name of names.sort()) {
    if (!name.endsWith('.json') || !isSeanceId(name.slice(0, -5))) continue;
    try {
      out.push(await loadSeance(deps, name.slice(0, -5)));
    } catch {
      // unreadable séance files are skipped
    }
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Listing without polling jobs: status comes from GET /seances/{id}. */
export async function listSeances(deps: Pick<SeanceDeps, 'root'>): Promise<Seance[]> {
  return (await allStored(deps)).map((s) => view(s, new Map()));
}

/** Wins, appearances, win rate and mean rank per model and runner over revealed séances. */
export function leaderboard(seances: StoredSeance[]): SeanceLeaderRow[] {
  const rows = new Map<string, SeanceLeaderRow & { rankSum: number }>();
  for (const s of seances) {
    if (!s.revealed) continue;
    for (const e of s.entries) {
      if (e.rank === null) continue;
      const runner = e.runner ?? 'unknown';
      const key = e.model + '\u0000' + runner;
      const row = rows.get(key) ?? {
        model: e.model,
        runner,
        appearances: 0,
        wins: 0,
        win_rate: 0,
        mean_rank: 0,
        rankSum: 0
      };
      row.appearances += 1;
      row.rankSum += e.rank;
      if (e.rank === 1) row.wins += 1;
      rows.set(key, row);
    }
  }
  return [...rows.values()]
    .map(({ rankSum, ...row }) => ({
      ...row,
      win_rate: Math.round((row.wins / row.appearances) * 1000) / 1000,
      mean_rank: Math.round((rankSum / row.appearances) * 1000) / 1000
    }))
    .sort(
      (a, b) =>
        b.win_rate - a.win_rate ||
        a.mean_rank - b.mean_rank ||
        b.appearances - a.appearances ||
        (a.model + a.runner).localeCompare(b.model + b.runner)
    );
}

export async function seanceLeaderboard(
  deps: Pick<SeanceDeps, 'root'>
): Promise<SeanceLeaderRow[]> {
  return leaderboard(await allStored(deps));
}
