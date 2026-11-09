import { describe, expect, test } from 'bun:test';
import {
  beatLimits,
  cleanBeatProject,
  newBeatProject,
  newPattern,
  noteCount,
  songTicks,
  stepOn,
  toggleStep,
  validateBeatProject,
  type BeatProject
} from './index';

const id = '11111111-2222-4333-8444-555555555555';
const project = (): BeatProject => newBeatProject(id, 'Night Drive', '2026-11-09T00:00:00.000Z');

describe('beat projects', () => {
  test('a new project is valid and comes with a starter kit and beat', () => {
    const p = project();
    expect(validateBeatProject(p)).toBeNull();
    expect(p.channels.map((c) => c.name)).toEqual(['Kick', 'Clap', 'Hat', 'Snare', 'Bass', 'Lead']);
    const kick = p.channels[0];
    expect([0, 4, 8, 12].every((s) => stepOn(p.patterns[0], kick, s))).toBe(true);
    expect(stepOn(p.patterns[0], kick, 1)).toBe(false);
    expect(songTicks(p)).toBe(384);
    expect(noteCount(p)).toBeGreaterThan(10);
  });

  test('steps are notes on the root key, and toggling twice restores the pattern', () => {
    const p = project();
    const pattern = p.patterns[0];
    const before = structuredClone(pattern);
    expect(toggleStep(pattern, p.channels[0], 3, 90)).toBe(true);
    expect(pattern.notes.kick).toContainEqual({ key: 60, start: 72, length: 24, velocity: 90 });
    expect(toggleStep(pattern, p.channels[0], 3)).toBe(false);
    expect(pattern).toEqual(before);
    // A piano-roll note on another key is not a step.
    pattern.notes.lead = [{ key: 64, start: 0, length: 24, velocity: 100 }];
    expect(stepOn(pattern, p.channels[5], 0)).toBe(false);
  });

  test('out-of-range values and unknown schemas are refused', () => {
    const bad = (change: (p: BeatProject) => void) => {
      const p = project();
      change(p);
      return validateBeatProject(p);
    };
    expect(bad((p) => ((p as { schema: number }).schema = 2))).toMatch(/schema/);
    expect(bad((p) => (p.bpm = 300))).toMatch(/BPM/);
    expect(bad((p) => (p.swing = 80))).toMatch(/Swing/);
    expect(bad((p) => (p.channels[1].id = 'kick'))).toMatch(/repeated/);
    expect(bad((p) => (p.channels[0].mixer.pan = 2))).toMatch(/mixer/);
    expect(bad((p) => (p.channels[0].colour = 'red'))).toMatch(/colour/);
    expect(bad((p) => (p.patterns[0].notes.ghost = []))).toMatch(/unknown channel/);
    expect(bad((p) => (p.patterns[0].notes.kick[0].start = 384))).toMatch(/note/);
    expect(bad((p) => (p.patterns[0].notes.kick[0].velocity = 0))).toMatch(/note/);
    expect(bad((p) => ((p.patterns[0] as { steps: number }).steps = 20))).toMatch(/steps/);
    expect(bad((p) => (p.playlist.clips[0].pattern_id = 'p9'))).toMatch(/clip/);
    expect(bad((p) => (p.playlist.clips[0].track = 16))).toMatch(/clip/);
    expect(bad((p) => (p.patterns = []))).toMatch(/patterns/);
    expect(
      bad((p) => {
        if (p.channels[4].instrument.kind === 'synth') p.channels[4].instrument.synth.osc.pop();
      })
    ).toMatch(/oscillators/);
    expect(
      bad((p) => (p.channels[0].instrument = { kind: 'sampler', sound_id: '../x', mode: 'gate' }))
    ).toMatch(/sound id/);
  });

  test('the note and clip caps are enforced', () => {
    const p = project();
    const big = newPattern('big', 'Big', 256);
    big.notes.kick = Array.from({ length: beatLimits.notes + 1 }, (_, i) => ({
      key: i % 128,
      start: i % (256 * 24),
      length: 1,
      velocity: 100
    }));
    p.patterns.push(big);
    expect(validateBeatProject(p)).toMatch(/at most 20,000 notes/);
    const q = project();
    q.playlist.clips = Array.from({ length: beatLimits.clips + 1 }, (_, i) => ({
      pattern_id: 'p1',
      track: 0,
      start_beat: i
    }));
    expect(validateBeatProject(q)).toMatch(/512 clips/);
  });
});

describe('project hygiene', () => {
  test('ids that name object built-ins are refused', () => {
    for (const bad of ['__proto__', 'constructor', 'toString', 'a b', '']) {
      const p = project();
      p.channels[0].id = bad;
      expect(validateBeatProject(p)).toMatch(/id/);
    }
  });

  test('cleaning keeps every known field and drops stray ones', () => {
    const p = project();
    expect(cleanBeatProject(p)).toEqual(p);
    const dirty = structuredClone(p) as BeatProject & { junk?: string };
    dirty.junk = 'x';
    (dirty.channels[0] as unknown as Record<string, unknown>).extra = 1;
    (dirty.patterns[0].notes.kick[0] as unknown as Record<string, unknown>).extra = 1;
    expect(cleanBeatProject(dirty)).toEqual(p);
  });
});
