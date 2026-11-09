import { describe, expect, test } from 'bun:test';
import { Midi } from '@tonejs/midi';
import { defaultRiffSettings, generateRiff, riffEvents } from './riff';
import {
  arrangementEvents,
  arrangementIssue,
  arrangementMidi,
  arrangementSeconds,
  chordLabel,
  createArrangement,
  readArrangement,
  trackNames
} from './arrangement';

const fixture = () => createArrangement(generateRiff({ ...defaultRiffSettings, swing: true }, 123));
describe('in-app riff arrangement', () => {
  test('preserves a separate source and produces deterministic bounded events', () => {
    const riff = generateRiff(defaultRiffSettings, 42),
      before = JSON.stringify(riff);
    const p = createArrangement(riff);
    const events = arrangementEvents(p);
    expect(JSON.stringify(riff)).toBe(before);
    expect(p.source).not.toBe(riff);
    p.source.steps[0].locked = true;
    expect(JSON.stringify(riff)).toBe(before);
    expect(events).toEqual(arrangementEvents(p));
    expect(arrangementSeconds(p)).toBe(56);
    for (const track of trackNames) {
      expect(events[track].length).toBeGreaterThan(0);
      for (const note of events[track]) {
        expect(note.time).toBeGreaterThanOrEqual(0);
        expect(note.time + note.duration).toBeLessThanOrEqual(56.000001);
        expect(note.velocity).toBeGreaterThan(0);
        expect(note.velocity).toBeLessThanOrEqual(1);
      }
    }
  });
  test('keeps source pitches, rests and swing in a complete section even over another chord', () => {
    const p = fixture();
    p.sections = [{ name: 'Chorus', bars: p.source.settings.bars, chord: 5, energy: 'full' }];
    const events = arrangementEvents(p).riff;
    const source = riffEvents(p.source);
    expect(events.map((n) => [n.midi, n.time, n.duration])).toEqual(
      source.map((n) => [n.midi, n.time, n.duration])
    );
    p.sections[0].chord = 2;
    expect(arrangementEvents(p).riff).toEqual(events);
  });
  test('mix, chords, energy and groove change backing without changing the source', () => {
    const p = fixture(),
      before = JSON.stringify(p.source),
      base = arrangementEvents(p);
    p.levels.bass = 0;
    expect(arrangementEvents(p).bass).toEqual([]);
    expect(arrangementEvents(p).riff).toEqual(base.riff);
    p.groove = 'half-time';
    expect(arrangementEvents(p).drums.length).toBeLessThan(base.drums.length);
    p.sections[0].chord = 3;
    expect(arrangementEvents(p).chords).not.toEqual(base.chords);
    p.sections[0].energy = 'full';
    expect(arrangementEvents(p).riff[0].velocity).toBeGreaterThan(base.riff[0].velocity);
    expect(JSON.stringify(p.source)).toBe(before);
    expect(chordLabel(p, 0)).toBe('E minor');
  });
  test('round trips a project and rejects malformed and excessive imported data', () => {
    const p = fixture();
    expect(readArrangement(JSON.stringify(p))).toEqual(p);
    for (const value of [
      null,
      {},
      { ...p, version: 2 },
      { ...p, title: 'x'.repeat(121) },
      { ...p, sections: [] },
      { ...p, sections: Array(9).fill(p.sections[0]) },
      { ...p, sections: [{ ...p.sections[0], bars: 1000000 }] },
      { ...p, sections: [{ ...p.sections[0], chord: -1 }] },
      { ...p, source: { ...p.source, settings: { ...p.source.settings, bpm: 0 } } },
      { ...p, levels: { ...p.levels, riff: 101 } },
      { ...p, levels: null }
    ]) {
      expect(readArrangement(JSON.stringify(value))).toBeNull();
    }
    expect(readArrangement('x'.repeat(50001))).toBeNull();
  });
  test('rejects silent, all-muted and overlong audio before rendering', () => {
    const p = fixture();
    p.sections = Array.from({ length: 8 }, () => ({
      name: 'Verse' as const,
      bars: 16,
      chord: 0,
      energy: 'full' as const
    }));
    expect(arrangementIssue(p)).toContain('180 seconds');
    expect(() => arrangementEvents(p)).toThrow('180 seconds');
    const quiet = fixture();
    quiet.levels = { riff: 0, bass: 0, chords: 0, drums: 0 };
    expect(() => arrangementEvents(quiet)).toThrow('Turn up');
    quiet.source.steps.forEach((s) => (s.midi = null));
    expect(() => arrangementEvents(quiet)).toThrow('Add a note');
    expect(() => createArrangement(quiet.source)).toThrow();
  });
  test('exports four real MIDI tracks with tempo, preserved riff notes and channel 10 drums', async () => {
    const p = fixture();
    const midi = new Midi(await arrangementMidi(p));
    expect(midi.header.tempos[0].bpm).toBeCloseTo(p.source.settings.bpm, 3);
    expect(midi.tracks.map((t) => t.name)).toEqual([...trackNames]);
    expect(midi.tracks.find((t) => t.name === 'drums')?.channel).toBe(9);
    const notes = arrangementEvents(p);
    for (const track of midi.tracks) {
      expect(track.notes.length).toBe(notes[track.name as keyof typeof notes].length);
      expect(track.endOfTrackTicks).toBe(28 * 4 * midi.header.ppq);
    }
    expect(midi.tracks[0].notes[0].midi).toBe(p.source.steps[0].midi!);
  });
});
