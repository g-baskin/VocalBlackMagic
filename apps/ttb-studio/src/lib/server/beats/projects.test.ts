import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BeatStore } from './projects';

let root: string;
let tick = 0;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-beats-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
const clock = () => new Date(Date.UTC(2026, 10, 9, 0, 0, tick++));

describe('BeatStore', () => {
  test('create, save, list and remove', async () => {
    const store = new BeatStore(root, clock);
    const project = await store.create('  Night Drive ');
    expect(project.name).toBe('Night Drive');
    project.bpm = 96;
    project.patterns[0].notes.lead = [{ key: 64, start: 0, length: 48, velocity: 100 }];
    const saved = await store.save(project.id, { ...project, created_at: 'forged' });
    expect(saved.created_at).toBe(project.created_at);
    expect(saved.updated_at > project.updated_at).toBe(true);
    expect(await store.get(project.id)).toEqual(saved);
    expect(await store.list()).toEqual([
      {
        id: project.id,
        name: 'Night Drive',
        bpm: 96,
        updated_at: saved.updated_at,
        channels: 6,
        patterns: 1
      }
    ]);
    expect((await readdir(store.dir)).filter((f) => f.endsWith('.tmp'))).toEqual([]);
    const extra = await store.save(project.id, { ...saved, junk: 'x'.repeat(1000) });
    expect('junk' in extra).toBe(false);
    await store.remove(project.id);
    await expect(store.get(project.id)).rejects.toMatchObject({ status: 404 });
  });

  test('invalid projects, mismatched ids and unknown schemas are refused', async () => {
    const store = new BeatStore(root, clock);
    const a = await store.create('A');
    await expect(store.save(a.id, { ...a, bpm: 999 })).rejects.toMatchObject({ status: 422 });
    const b = await store.create('B');
    await expect(store.save(a.id, b)).rejects.toMatchObject({ status: 422 });
    await writeFile(path.join(store.dir, a.id + '.json'), JSON.stringify({ ...a, schema: 2 }));
    await expect(store.get(a.id)).rejects.toMatchObject({ status: 422 });
    await writeFile(path.join(store.dir, b.id + '.json'), '{not json');
    await expect(store.get(b.id)).rejects.toMatchObject({ status: 500 });
    expect(await store.list()).toEqual([]);
    await expect(store.get('../../secrets')).rejects.toMatchObject({ status: 404 });
    await expect(store.save('nope', a)).rejects.toMatchObject({ status: 404 });
    await expect(store.remove('nope')).rejects.toMatchObject({ status: 404 });
  });
});
