import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { KitStore } from './kits';

let root: string;
let tick = 0;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'vbm-kits-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
const clock = () => new Date(Date.UTC(2026, 10, 8, 0, 0, tick++));

describe('KitStore', () => {
  test('create, save, list and remove', async () => {
    const store = new KitStore(root, clock);
    const kit = await store.create('  Orca Breach ');
    expect(kit.name).toBe('Orca Breach');
    kit.pads[0].layers[0] = '11111111-2222-4333-8444-555555555555';
    kit.bpm = 90;
    const saved = await store.save(kit.id, { ...kit, created_at: 'forged' });
    expect(saved.created_at).toBe(kit.created_at);
    expect(saved.updated_at > kit.updated_at).toBe(true);
    expect(await store.get(kit.id)).toEqual(saved);
    expect(await store.list()).toEqual([
      { id: kit.id, name: 'Orca Breach', bpm: 90, updated_at: saved.updated_at, pads_used: 1 }
    ]);
    expect((await readdir(store.kitsDir)).filter((f) => f.endsWith('.tmp'))).toEqual([]);
    await store.remove(kit.id);
    await expect(store.get(kit.id)).rejects.toMatchObject({ status: 404 });
  });

  test('invalid kits, mismatched ids and unknown schemas are refused', async () => {
    const store = new KitStore(root, clock);
    const kit = await store.create('A');
    await expect(store.save(kit.id, { ...kit, bpm: 999 })).rejects.toMatchObject({ status: 422 });
    const other = await store.create('B');
    await expect(store.save(kit.id, other)).rejects.toMatchObject({ status: 422 });
    await writeFile(
      path.join(store.kitsDir, kit.id + '.json'),
      JSON.stringify({ ...kit, schema: 2 })
    );
    await expect(store.get(kit.id)).rejects.toMatchObject({ status: 422 });
    expect((await store.list()).map((k) => k.name)).toEqual(['B']);
    await expect(store.get('../../secrets')).rejects.toMatchObject({ status: 404 });
    await expect(store.save('nope', kit)).rejects.toMatchObject({ status: 404 });
  });
});
