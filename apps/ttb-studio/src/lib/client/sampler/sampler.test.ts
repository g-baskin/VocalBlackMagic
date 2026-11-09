import { describe, expect, test } from 'bun:test';
import { newKit, validateKit, type SoundCategory, type SoundMeta } from '@vbm/contracts';
import type { LoadedSound } from './engine';
import { History } from './history';
import { inspire, seeded } from './inspire';
import { isTypingTarget, keyLabel, octaveShift, padForKey } from './keys';
import { gridSeconds, hitTicks, planLaunch } from './launch';
import { busSettings, macroTargets, velocityGain } from './macros';
import { macroForCc, parseMidi } from './midi';
import { padSeconds, reelPlan } from './render';

const kit = () => newKit('11111111-2222-4333-8444-555555555555', 'Test', '2026-11-08T00:00:00Z');

describe('launch: the hit lands on the grid', () => {
  test('grid lengths at 120 BPM', () => {
    expect(gridSeconds('natural', 120)).toBe(0);
    expect(gridSeconds('1/8', 120)).toBe(0.25);
    expect(gridSeconds('1 bar', 120)).toBe(2);
    expect(gridSeconds('8 bars', 120)).toBe(16);
  });

  test('natural plays at once', () => {
    const p = planLaunch({ now: 3, origin: 0, grid: 'natural', bpm: 120, hit: 1.5, sync: true });
    expect(p.rate).toBe(1);
    expect(p.startAt).toBeCloseTo(3.005, 6);
    expect(p.hitAt).toBeCloseTo(4.505, 6);
  });

  test('without sync the start is moved so the hit lands on the next bar', () => {
    const p = planLaunch({ now: 0.3, origin: 0, grid: '1 bar', bpm: 120, hit: 1.5, sync: false });
    expect(p.rate).toBe(1);
    expect(p.hitAt).toBe(2);
    expect(p.startAt).toBeCloseTo(0.5, 9);
    // Too late for this bar: wait for the next one, never start in the past.
    const late = planLaunch({
      now: 0.6,
      origin: 0,
      grid: '1 bar',
      bpm: 120,
      hit: 1.5,
      sync: false
    });
    expect(late.hitAt).toBe(4);
    expect(late.startAt).toBeGreaterThan(0.6);
  });

  test('sync stretches the pre-hit part to one grid step', () => {
    const p = planLaunch({ now: 0.1, origin: 0, grid: '1 bar', bpm: 120, hit: 3, sync: true });
    expect(p.rate).toBeCloseTo(1.5, 9);
    expect(p.hitAt - p.startAt).toBeCloseTo(2, 9);
    expect(p.hitAt).toBe(4);
    expect(p.startAt).toBeCloseTo(2, 9);
    const clamped = planLaunch({ now: 0, origin: 0, grid: '1/8', bpm: 120, hit: 4, sync: true });
    expect(clamped.rate).toBe(4);
    expect((clamped.hitAt / 0.25) % 1).toBeCloseTo(0, 9);
    const atStart = planLaunch({ now: 0, origin: 0, grid: '1/4', bpm: 120, hit: 0, sync: true });
    expect(atStart.rate).toBe(1);
    expect(atStart.startAt).toBe(atStart.hitAt);
  });

  test('bar ticks count back from the hit', () => {
    const ticks = hitTicks(4.2, 120, 1);
    expect(ticks).toHaveLength(8);
    expect(ticks[3]).toEqual({ at: expect.closeTo(2.2, 9), bar: -1 });
    expect(ticks[7].bar).toBe(-2);
  });
});

describe('macros', () => {
  test('all zero leaves the sound alone', () => {
    expect(macroTargets([0, 0, 0, 0, 0, 0, 0, 0])).toEqual({
      cutoffScale: 1,
      crushBits: 16,
      reverbMix: 0,
      delayMix: 0,
      drive: 0,
      lowShelfDb: 0,
      highShelfDb: 0,
      attackMs: 0
    });
  });

  test('each macro moves its target, and Darken scales the whole-kit cutoff', () => {
    const t = macroTargets([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(t.cutoffScale).toBeCloseTo(250 / 20000, 9);
    expect(t.crushBits).toBe(4);
    expect(t.reverbMix).toBeCloseTo(0.6, 9);
    expect(t.attackMs).toBe(2000);
    const k = kit();
    k.macros[0] = 0.5;
    expect(busSettings(k).cutoffHz).toBeCloseTo(Math.sqrt(250 * 20000), 3);
    expect(macroTargets([2, -1]).cutoffScale).toBeCloseTo(250 / 20000, 9);
  });

  test('velocity sensitivity', () => {
    expect(velocityGain(1, 0)).toBe(1);
    expect(velocityGain(127, 100)).toBe(1);
    expect(velocityGain(64, 100)).toBeCloseTo(64 / 127, 9);
    expect(velocityGain(0, 50)).toBeCloseTo(1 - 0.5 * (1 - 1 / 127), 9);
  });
});

describe('history', () => {
  test('undo and redo restore snapshots, not live references', () => {
    const h = new History<{ v: number }>(2);
    const state = { v: 1 };
    h.push(state);
    state.v = 2;
    h.push(state);
    state.v = 3;
    h.push(state);
    expect(h.undo({ v: 4 })).toEqual({ v: 3 });
    expect(h.undo({ v: 3 })).toEqual({ v: 2 });
    expect(h.undo({ v: 2 })).toBeNull();
    expect(h.redo({ v: 2 })).toEqual({ v: 3 });
    h.push({ v: 9 });
    expect(h.canRedo).toBe(false);
  });
});

describe('inspire', () => {
  const sounds = (['impact', 'pad', 'bass', 'vocal'] as SoundCategory[]).flatMap((category, c) =>
    Array.from({ length: 3 }, (_, i) => ({
      id: `00000000-0000-4000-8000-0000000000${c}${i}`,
      category
    }))
  );
  test('is reproducible from its seed and keeps the kit valid', () => {
    const a = inspire(kit(), sounds, 42);
    expect(inspire(kit(), sounds, 42)).toEqual(a);
    expect(inspire(kit(), sounds, 43)).not.toEqual(a);
    expect(validateKit(a)).toBeNull();
    expect(a.pads.every((p) => p.layers[0] !== null)).toBe(true);
    for (let row = 0; row < 6; row++) {
      const cats = new Set(
        a.pads
          .slice(row * 6, row * 6 + 6)
          .map((p) => sounds.find((s) => s.id === p.layers[0])?.category)
      );
      expect(cats.size).toBe(1);
    }
  });

  test('with no sounds only the macros change', () => {
    const k = kit();
    const out = inspire(k, [], 7);
    expect(out.pads).toEqual(k.pads);
    expect(out.macros.some((m) => m > 0)).toBe(true);
    expect(k.macros.every((m) => m === 0)).toBe(true);
  });

  test('seeded numbers are in [0, 1)', () => {
    const r = seeded(1);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v >= 0 && v < 1).toBe(true);
    }
  });
});

describe('keyboard and MIDI input', () => {
  test('two rows play pads by octave; Z and X shift', () => {
    expect(padForKey('KeyA', 0)).toBe(0);
    expect(padForKey('KeyW', 0)).toBe(1);
    expect(padForKey('Semicolon', 1)).toBe(28);
    expect(padForKey('KeyJ', 2)).toBe(35);
    expect(padForKey('KeyK', 2)).toBeNull();
    expect(padForKey('KeyQ', 0)).toBeNull();
    expect(octaveShift('KeyZ')).toBe(-1);
    expect(octaveShift('KeyX')).toBe(1);
    expect(keyLabel(13, 1)).toBe('W');
    expect(keyLabel(5, 1)).toBeNull();
  });

  test('typing in a field never plays a pad', () => {
    const el = (match: boolean, editable = false) =>
      ({
        isContentEditable: editable,
        closest: () => (match ? {} : null)
      }) as unknown as EventTarget;
    expect(isTypingTarget(el(true))).toBe(true);
    expect(isTypingTarget(el(false, true))).toBe(true);
    expect(isTypingTarget(el(false))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  test('MIDI note on, note off (including velocity 0) and CC on any channel', () => {
    expect(parseMidi([0x93, 36, 100])).toEqual({ type: 'on', note: 36, velocity: 100 });
    expect(parseMidi([0x90, 36, 0])).toEqual({ type: 'off', note: 36 });
    expect(parseMidi([0x8f, 40, 64])).toEqual({ type: 'off', note: 40 });
    expect(parseMidi([0xb0, 21, 127])).toEqual({ type: 'cc', controller: 21, value: 127 });
    expect(parseMidi([0xe0, 0, 64])).toBeNull();
    expect(parseMidi([0xf8])).toBeNull();
    expect(macroForCc(21)).toBe(0);
    expect(macroForCc(77)).toBe(7);
    expect(macroForCc(1)).toBeNull();
  });
});

describe('export plan', () => {
  const loaded = (id: string, seconds: number): [string, LoadedSound] => [
    id,
    {
      meta: { id } as SoundMeta,
      forward: { duration: seconds } as AudioBuffer,
      reversed: {} as AudioBuffer
    }
  ];
  test('pads play one after another; the longest layer sets each length', () => {
    const k = kit();
    const a = '00000000-0000-4000-8000-00000000000a';
    const b = '00000000-0000-4000-8000-00000000000b';
    k.pads[0].layers = [a, b, null];
    k.pads[5].layers = [null, null, b];
    k.pads[7].layers = ['00000000-0000-4000-8000-00000000000c', null, null];
    const sounds = new Map([loaded(a, 1), loaded(b, 2)]);
    expect(padSeconds(k, 0, sounds)).toBe(2);
    expect(reelPlan(k, sounds)).toEqual([
      { pad: 0, at: 0 },
      { pad: 5, at: 2.25 }
    ]);
    k.whole.pitch_st = 12;
    expect(padSeconds(k, 0, sounds)).toBe(1);
  });
});

describe('more like this', () => {
  test('nearest by brightness, noise, loudness and punch', async () => {
    const { moreLike } = await import('./similar');
    const f = (centroid_hz: number, flatness: number) => ({
      peak_db: -1,
      rms_db: -12,
      crest_db: 11,
      centroid_hz,
      flatness,
      thumb: []
    });
    const s = (id: string, centroid: number, flat: number) =>
      ({ id, name: id, features: f(centroid, flat) }) as unknown as SoundMeta;
    const target = s('t', 1000, 0.1);
    const near = s('near', 1100, 0.12);
    const far = s('far', 9000, 0.6);
    expect(moreLike(target, [far, target, near]).map((x) => x.id)).toEqual(['near', 'far']);
  });
});

describe('pad rate', () => {
  test('pitch and sync combine so the stretched pre-hit is one grid step', async () => {
    const { launchRate } = await import('./engine');
    const k = kit();
    k.pads[0].launch = { lands_on: '1 bar', mode: 'one-shot', sync: true, reverse: false };
    expect(launchRate(k, 0, 3).total).toBeCloseTo(1.5, 9);
    k.whole.pitch_st = 12;
    const r = launchRate(k, 0, 3);
    expect(3 / r.total).toBeCloseTo(2, 9);
    expect(r.launch).toBeCloseTo(0.75, 9);
    k.pads[0].launch.sync = false;
    expect(launchRate(k, 0, 3)).toEqual({ launch: 1, total: 2 });
    expect(launchRate(k, 0, 3, true)).toEqual({ launch: 1, total: 2 });
  });
});
