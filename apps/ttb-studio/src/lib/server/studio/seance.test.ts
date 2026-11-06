import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  studioModels,
  validateSeanceRequest,
  type CreateSongRequest,
  type StudioJob,
  type StudioModelInfo
} from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import {
  getSeance,
  leaderboard,
  listSeances,
  loadSeance,
  rankSeance,
  SeanceRefused,
  shuffledLabels,
  startSeance,
  type SeanceDeps,
  type StoredSeance
} from './seance';

const info = (id: StudioModelInfo['id'], over: Partial<StudioModelInfo> = {}): StudioModelInfo => ({
  id,
  name: id,
  open: true,
  vocals: true,
  instrumental: true,
  runners: [
    {
      kind: 'replicate',
      model_version: 'v',
      license: 'MIT',
      commercial: true,
      license_badge: 'MIT',
      status: 'ready'
    }
  ],
  est_cost_usd: 0.1,
  active_runner: 'replicate',
  ...over
});

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-seance-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function fakeDeps(over: Partial<SeanceDeps> = {}) {
  const created: CreateSongRequest[] = [];
  const jobs = new Map<string, StudioJob>();
  let lyricCalls = 0;
  const deps: SeanceDeps = {
    root,
    now: () => new Date('2026-11-06T12:00:00Z'),
    random: () => 0,
    capabilities: async () => [
      info('ace-step-1.5'),
      info('heartmula'),
      info('minimax-music-2.6'),
      info('elevenlabs-music'),
      info('yue', { active_runner: null, runners: [] }),
      info('diffrhythm', { vocals: false })
    ],
    writeLyrics: async () => {
      lyricCalls += 1;
      return { lyrics: '[Verse]\nshared words', title: 'Shared' };
    },
    create: async (request) => {
      created.push(request);
      const id = crypto.randomUUID();
      const job: StudioJob = {
        id,
        kind: 'create',
        status: 'completed',
        stages: [],
        song_ids: [crypto.randomUUID()],
        created_at: '',
        updated_at: ''
      };
      jobs.set(id, job);
      return { job, lyrics: request.lyrics, title: request.title };
    },
    advance: async (id) => jobs.get(id)!,
    jobRunner: async () => 'replicate',
    ...over
  };
  return { deps, created, jobs, lyricCalls: () => lyricCalls };
}

const body = { prompt: 'haunted synthwave', models: ['ace-step-1.5', 'heartmula'] };

describe('validateSeanceRequest', () => {
  test('accepts 2 to 4 distinct models', () => {
    expect(validateSeanceRequest(body)).toBeNull();
    expect(
      validateSeanceRequest({ ...body, models: [...studioModels].slice(0, 4), lyrics: null })
    ).toBeNull();
  });
  test('rejects bad shapes', () => {
    expect(validateSeanceRequest(null)).toBe('Body must be a JSON object.');
    expect(validateSeanceRequest({ ...body, prompt: ' ' })).toContain('prompt');
    expect(validateSeanceRequest({ ...body, models: ['heartmula'] })).toBe('Choose 2 to 4 models.');
    expect(validateSeanceRequest({ ...body, models: [...studioModels].slice(0, 5) })).toBe(
      'Choose 2 to 4 models.'
    );
    expect(validateSeanceRequest({ ...body, models: ['heartmula', 'heartmula'] })).toBe(
      'Each model may appear only once.'
    );
    expect(validateSeanceRequest({ ...body, models: ['heartmula', 'suno'] })).toBe(
      'Unknown model.'
    );
    expect(validateSeanceRequest({ ...body, instrumental: 'yes' })).toContain('instrumental');
  });
});

describe('shuffledLabels', () => {
  test('is a permutation of the first n labels', () => {
    let x = 0.37;
    const random = () => (x = (x * 9301 + 0.49297) % 1);
    for (let n = 2; n <= 4; n += 1)
      expect([...shuffledLabels(n, random)].sort()).toEqual(['A', 'B', 'C', 'D'].slice(0, n));
  });
  test('the order depends on the random source', () => {
    expect(shuffledLabels(4, () => 0)).toEqual(['B', 'C', 'D', 'A']);
    expect(shuffledLabels(4, () => 0.999)).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('startSeance', () => {
  test('one take per model, shared lyrics written once, through createSongs', async () => {
    const f = fakeDeps();
    const s = await startSeance(f.deps, {
      ...body,
      models: ['ace-step-1.5', 'heartmula', 'minimax-music-2.6']
    });
    expect(f.lyricCalls()).toBe(1);
    expect(f.created.map((r) => r.model)).toHaveLength(3);
    expect(new Set(f.created.map((r) => r.lyrics))).toEqual(new Set(['[Verse]\nshared words']));
    expect(f.created.every((r) => r.takes === 1 && r.cover === false)).toBe(true);
    expect(s.entries.map((e) => e.label)).toEqual(['A', 'B', 'C']);
  });

  test('pre-reveal JSON never names a model or runner', async () => {
    const f = fakeDeps();
    const s = await startSeance(f.deps, { ...body, title: 'Night' });
    const fetched = await getSeance(f.deps, s.id);
    const listed = await listSeances(f.deps);
    for (const json of [JSON.stringify(s), JSON.stringify(fetched), JSON.stringify(listed)]) {
      for (const id of studioModels) expect(json).not.toContain(id);
      expect(json).not.toContain('replicate');
    }
    expect(fetched.entries.every((e) => e.model === undefined && e.runner === undefined)).toBe(
      true
    );
    // ...but song ids (which point at the audio) are there once the jobs finish
    expect(fetched.entries.every((e) => e.song_id)).toBe(true);
  });

  test('a failure detail stays generic before the reveal', async () => {
    const f = fakeDeps({
      create: async (r) => {
        throw new ProviderError(503, r.model + ' via replicate exploded');
      }
    });
    const s = await startSeance(f.deps, body);
    expect(s.entries.every((e) => e.status === 'failed' && e.detail === 'This take failed.')).toBe(
      true
    );
    expect(JSON.stringify(s)).not.toContain('heartmula');
  });

  test('refused models are all reported, none dropped, nothing is paid for', async () => {
    const f = fakeDeps();
    let error: unknown;
    try {
      await startSeance(f.deps, { ...body, models: ['ace-step-1.5', 'yue', 'diffrhythm'] });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(SeanceRefused);
    const refused = (error as SeanceRefused).refused;
    expect(refused.map((r) => r.model)).toEqual(['yue', 'diffrhythm']);
    expect(refused[0].reason).toContain('no ready runner');
    expect(refused[1].reason).toBe('makes instrumentals only');
    expect(f.created).toHaveLength(0);
    expect(f.lyricCalls()).toBe(0);
  });

  test('instrumental séances skip the lyricist', async () => {
    const f = fakeDeps();
    await startSeance(f.deps, { ...body, instrumental: true, lyrics: 'ignored' });
    expect(f.lyricCalls()).toBe(0);
    expect(f.created.every((r) => r.instrumental && r.lyrics === null)).toBe(true);
  });

  test('no lyricist and no lyrics is a clear 503', async () => {
    const f = fakeDeps({ writeLyrics: null });
    await expect(startSeance(f.deps, body)).rejects.toThrow('lyricist');
  });
});

describe('rankSeance', () => {
  test('reveals once; a second ranking is refused', async () => {
    const f = fakeDeps();
    const s = await startSeance(f.deps, body);
    const revealed = await rankSeance(f.deps, s.id, ['B', 'A']);
    expect(revealed.revealed).toBe(true);
    expect(revealed.entries.every((e) => e.model && e.runner === 'replicate')).toBe(true);
    expect(revealed.entries.find((e) => e.label === 'B')!.rank).toBe(1);
    await expect(rankSeance(f.deps, s.id, ['A', 'B'])).rejects.toThrow('already revealed');
    expect((await loadSeance(f.deps, s.id)).ranking).toEqual(['B', 'A']);
  });

  test('must name exactly the finished takes', async () => {
    const f = fakeDeps();
    const s = await startSeance(f.deps, body);
    await expect(rankSeance(f.deps, s.id, ['A'])).rejects.toThrow('Rank exactly');
    await expect(rankSeance(f.deps, s.id, ['A', 'A'])).rejects.toThrow('Rank exactly');
    await expect(rankSeance(f.deps, s.id, ['A', 'C'])).rejects.toThrow('Rank exactly');
  });

  test('waits for running takes', async () => {
    const f = fakeDeps();
    const s = await startSeance(f.deps, body);
    for (const job of f.jobs.values()) job.status = 'running';
    await expect(rankSeance(f.deps, s.id, ['A', 'B'])).rejects.toThrow('Wait until');
  });
});

describe('ids', () => {
  test('traversal-shaped ids are not found and touch nothing', async () => {
    const f = fakeDeps();
    for (const id of ['../../etc/passwd', '..', 'a/b', '%2e%2e', ''])
      await expect(getSeance(f.deps, id)).rejects.toThrow('Séance not found.');
    await expect(rankSeance(f.deps, '../x', ['A', 'B'])).rejects.toThrow('Séance not found.');
    expect(await readdir(root)).toEqual([]);
  });
});

describe('leaderboard', () => {
  const s = (entries: [string, string, number | null][], revealed = true): StoredSeance => ({
    id: crypto.randomUUID(),
    prompt: 'p',
    lyrics: null,
    title: 't',
    instrumental: false,
    created_at: '',
    revealed,
    ranking: null,
    entries: entries.map(([model, runner, rank], i) => ({
      label: (['A', 'B', 'C', 'D'] as const)[i],
      model: model as StoredSeance['entries'][number]['model'],
      runner,
      job_id: null,
      error: null,
      rank
    }))
  });
  test('wins, appearances, win rate and mean rank per model and runner', () => {
    const rows = leaderboard([
      s([
        ['heartmula', 'engine', 1],
        ['yue', 'replicate', 2]
      ]),
      s([
        ['heartmula', 'engine', 2],
        ['yue', 'replicate', 1],
        ['ace-step-1.5', 'fal', 3]
      ]),
      s([
        ['heartmula', 'engine', 1],
        ['ace-step-1.5', 'fal', null]
      ]),
      s([['yue', 'replicate', 1]], false)
    ]);
    expect(rows).toEqual([
      {
        model: 'heartmula',
        runner: 'engine',
        appearances: 3,
        wins: 2,
        win_rate: 0.667,
        mean_rank: 1.333
      },
      { model: 'yue', runner: 'replicate', appearances: 2, wins: 1, win_rate: 0.5, mean_rank: 1.5 },
      { model: 'ace-step-1.5', runner: 'fal', appearances: 1, wins: 0, win_rate: 0, mean_rank: 3 }
    ]);
  });
  test('the same model on different runners is ranked separately', () => {
    const rows = leaderboard([
      s([
        ['heartmula', 'engine', 1],
        ['heartmula', 'replicate', 2]
      ])
    ]);
    expect(rows.map((r) => r.runner)).toEqual(['engine', 'replicate']);
  });
});
