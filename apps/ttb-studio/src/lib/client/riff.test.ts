import { describe, expect, test } from 'bun:test';
import { Midi } from '@tonejs/midi';
import {
  defaultRiffSettings,
  generateRiff,
  readRiffDraft,
  riffEvents,
  riffMidi,
  riffNotes,
  validSettings
} from './riff';

describe('original procedural riffs', () => {
  test('deterministic, bounded notes in the selected scale; no mutation of defaults', () => {
    const settings = { ...defaultRiffSettings };
    const a = generateRiff(settings, 42);
    expect(generateRiff(settings, 42)).toEqual(a);
    expect(generateRiff(settings, 43).steps).not.toEqual(a.steps);
    expect(a.steps).toHaveLength(32);
    expect(a.steps.every((s) => s.midi === null || riffNotes(settings).includes(s.midi))).toBe(
      true
    );
    expect(a.steps[0].midi).not.toBeNull();
    expect(settings).toEqual(defaultRiffSettings);
    expect(a.steps[0]).not.toBe(a.steps[16]);
  });
  test('locked notes and rests survive variations and the old draft stays unchanged', () => {
    const before = generateRiff(defaultRiffSettings, 1);
    before.steps[0] = { midi: 65, velocity: 0.5, locked: true };
    before.steps[1] = { midi: null, velocity: 0.7, locked: true };
    const snapshot = JSON.stringify(before);
    const next = generateRiff({ ...defaultRiffSettings, key: 'C', bars: 8 }, 73, before.steps);
    expect(next.steps).toHaveLength(64);
    expect(next.steps.slice(0, 2)).toEqual(before.steps.slice(0, 2));
    expect(next.steps[0]).not.toBe(before.steps[0]);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
  test('rejects bad controls and corrupted or oversized on-device drafts', () => {
    for (const patch of [
      { bpm: 0 },
      { bpm: 181 },
      { bpm: NaN },
      { bars: 999 },
      { key: 'bad' },
      { scale: 'unknown' },
      { instrument: 'bad' },
      { swing: 'yes' }
    ])
      expect(validSettings({ ...defaultRiffSettings, ...patch })).toBe(false);
    const draft = generateRiff(defaultRiffSettings, 99);
    expect(readRiffDraft(JSON.stringify(draft))).toEqual(draft);
    for (const text of [
      '{}',
      'null',
      '[1]',
      'bad',
      ' '.repeat(20001),
      JSON.stringify({ ...draft, steps: [] }),
      JSON.stringify({ ...draft, version: 2 })
    ])
      expect(readRiffDraft(text)).toBeNull();
    draft.steps[0].midi = 1000;
    expect(readRiffDraft(JSON.stringify(draft))).toBeNull();
    expect(() => generateRiff({ ...defaultRiffSettings, bpm: 0 }, 1)).toThrow();
  });
  test('swing shifts only offbeats and export preserves actual notes, tempo and instrument', async () => {
    const draft = generateRiff(
      { ...defaultRiffSettings, instrument: 'bass', bars: 2, density: 'busy' },
      5
    );
    draft.steps[1].midi = 40;
    const straight = riffEvents(draft);
    const swing = riffEvents({ ...draft, settings: { ...draft.settings, swing: true } });
    expect(swing[0].time).toBe(straight[0].time);
    expect(swing[1].time).toBeGreaterThan(straight[1].time);
    const bytes = await riffMidi(draft);
    const midi = new Midi(bytes);
    expect(midi.header.tempos[0].bpm).toBeCloseTo(120);
    expect(midi.tracks[0].instrument.number).toBe(33);
    expect(midi.tracks[0].notes.map((n) => n.midi)).toEqual(straight.map((n) => n.midi));
    expect(midi.tracks[0].notes).toHaveLength(straight.length);
  });
});
