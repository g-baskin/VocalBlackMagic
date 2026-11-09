import { describe, expect, test } from 'bun:test';
import { newBeatProject, newPattern, type BeatProject } from '@vbm/contracts';
import { audibleChannels, loopTicks, swingOffset, windowEvents } from './schedule';

const project = (): BeatProject =>
  newBeatProject('11111111-2222-4333-8444-555555555555', 'T', '2026-11-09T00:00:00.000Z');
const kicks = (p: BeatProject, from: number, to: number, mode: 'pattern' | 'song' = 'pattern') =>
  windowEvents(p, mode, 'p1', from, to)
    .filter((e) => e.channel === 'kick')
    .map((e) => e.tick);

describe('schedule', () => {
  test('pattern mode loops, and a window across the loop point wraps', () => {
    const p = project();
    expect(loopTicks(p, 'pattern', 'p1')).toBe(384);
    expect(kicks(p, 0, 384)).toEqual([0, 96, 192, 288]);
    expect(kicks(p, 300, 400)).toEqual([384]);
    expect(kicks(p, 384 * 5, 384 * 5 + 97)).toEqual([1920, 2016]);
    expect(windowEvents(p, 'pattern', 'p1', 300, 400, false).some((e) => e.tick >= 384)).toBe(
      false
    );
    expect(windowEvents(p, 'pattern', 'missing', 0, 384)).toEqual([]);
  });

  test('swing pushes only the second 16th of each pair', () => {
    expect(swingOffset(0, 50)).toBe(0);
    expect(swingOffset(24, 50)).toBe(6);
    expect(swingOffset(48, 50)).toBe(0);
    expect(swingOffset(72, 75)).toBe(9);
    const p = project();
    p.swing = 50;
    const hats = windowEvents(p, 'pattern', 'p1', 0, 96).filter((e) => e.channel === 'hat');
    expect(hats.map((e) => e.tick)).toEqual([0, 48]);
    p.patterns[0].notes.hat.push({ key: 60, start: 24, length: 24, velocity: 90 });
    const swung = windowEvents(p, 'pattern', 'p1', 0, 96).filter((e) => e.channel === 'hat');
    expect(swung.map((e) => e.tick)).toEqual([0, 30, 48]);
  });

  test('song mode plays clips where they sit and loops the song', () => {
    const p = project();
    const b = newPattern('p2', 'B', 32);
    b.notes.kick = [{ key: 60, start: 0, length: 24, velocity: 100 }];
    p.patterns.push(b);
    p.playlist.clips = [
      { pattern_id: 'p1', track: 0, start_beat: 0 },
      { pattern_id: 'p2', track: 1, start_beat: 8 }
    ];
    // Bars 1 (p1), 2 empty, 3–4 (p2): 4 bars.
    expect(loopTicks(p, 'song', 'p1')).toBe(1536);
    expect(kicks(p, 0, 1536, 'song')).toEqual([0, 96, 192, 288, 768]);
    expect(kicks(p, 1500, 1600, 'song')).toEqual([1536]);
    p.playlist.clips = [];
    expect(windowEvents(p, 'song', 'p1', 0, 1000)).toEqual([]);
  });

  test('mute and solo choose what sounds', () => {
    const p = project();
    expect(audibleChannels(p.channels).size).toBe(6);
    p.channels[0].mixer.mute = true;
    expect(audibleChannels(p.channels).has('kick')).toBe(false);
    p.channels[2].mixer.solo = true;
    p.channels[0].mixer.solo = true;
    expect([...audibleChannels(p.channels)]).toEqual(['hat']);
    const chans = new Set(windowEvents(p, 'pattern', 'p1', 0, 384).map((e) => e.channel));
    expect([...chans]).toEqual(['hat']);
  });
});

import type { BeatNote } from '@vbm/contracts';
import {
  drawNote,
  eraseAt,
  hitTest,
  moveNotes,
  notesInRect,
  resizeNotes,
  setVelocity,
  snapDelta,
  snapDown,
  sortNotes
} from './pianoroll';
import { Transport, type TransportSink } from './transport';

const n = (key: number, start: number, length = 24, velocity = 100): BeatNote => ({
  key,
  start,
  length,
  velocity
});

describe('piano roll helpers', () => {
  test('snap and hit-test', () => {
    expect(snapDown(50, 24)).toBe(48);
    expect(snapDown(50, 1)).toBe(50);
    expect(snapDelta(13, 24)).toBe(24);
    expect(snapDelta(-11, 24)).toBe(-0);
    const notes = [n(60, 0, 48), n(60, 24, 48)];
    expect(hitTest(notes, 30, 60)).toEqual({ index: 1, part: 'body' });
    expect(hitTest(notes, 70, 60)).toEqual({ index: 1, part: 'end' });
    expect(hitTest(notes, 10, 60)).toEqual({ index: 0, part: 'body' });
    expect(hitTest(notes, 10, 61)).toBeNull();
    expect(hitTest(notes, 72, 60)).toBeNull();
  });

  test('moves keep the group inside the pattern and key range', () => {
    const notes = [n(60, 0), n(64, 48), n(127, 96)];
    expect(moveNotes(notes, [0, 1], 24, 2, 384).slice(0, 2)).toEqual([n(62, 24), n(66, 72)]);
    // The group stops at tick 0 rather than squashing together.
    expect(moveNotes(notes, [0, 1], -100, 0, 384).slice(0, 2)).toEqual([n(60, 0), n(64, 48)]);
    expect(moveNotes(notes, [1, 2], 0, 5, 384)[2].key).toBe(127);
    expect(moveNotes(notes, [2], 1000, 0, 384)[2].start).toBe(383);
    expect(moveNotes(notes, [], 24, 0, 384)).toEqual(notes);
  });

  test('draw, resize, erase, select and velocity', () => {
    const drawn = drawNote([], 30.4, 61, 24, 200, 384);
    expect(drawn).toEqual({ notes: [n(61, 30, 24, 127)], index: 0 });
    expect(resizeNotes([n(60, 0)], [0], -100, 6, 384)).toEqual([n(60, 0, 6)]);
    expect(resizeNotes([n(60, 0)], [0], 1000, 6, 384)).toEqual([n(60, 0, 384)]);
    const notes = [n(60, 0), n(62, 48), n(64, 96)];
    expect(eraseAt(notes, 50, 62)).toEqual([n(60, 0), n(64, 96)]);
    expect(eraseAt(notes, 50, 63)).toEqual(notes);
    expect(notesInRect(notes, 60, 20, 59, 62)).toEqual([0, 1]);
    expect(setVelocity(notes, [2], 0)[2].velocity).toBe(1);
    const sorted = sortNotes([n(64, 96), n(60, 0), n(62, 48)], [0]);
    expect(sorted.notes.map((x) => x.key)).toEqual([60, 62, 64]);
    expect(sorted.selected).toEqual([2]);
  });
});

describe('transport', () => {
  function fake() {
    const ctx = { currentTime: 0 };
    const notes: { channel: string; at: number }[] = [];
    const clicks: number[] = [];
    const sink: TransportSink = {
      ctx,
      note: (channel, _k, _v, at) => notes.push({ channel, at }),
      click: (at) => clicks.push(at),
      stopAll: () => {}
    };
    return { ctx, notes, clicks, sink };
  }

  test('schedules each note once on the audio clock, ahead of time', () => {
    const p = project();
    p.bpm = 120;
    const { ctx, notes, sink } = fake();
    const t = new Transport(sink, () => p);
    t.play('pattern', 'p1');
    for (let time = 0; time < 2.2; time += 0.025) {
      ctx.currentTime = time;
      t.pump();
    }
    const kickTimes = notes.filter((x) => x.channel === 'kick').map((x) => +x.at.toFixed(3));
    // 120 BPM: a beat every 0.5 s after the 50 ms lead-in, looping each 2 s bar.
    expect(kickTimes).toEqual([0.05, 0.55, 1.05, 1.55, 2.05]);
    expect(t.position()?.loop).toBeGreaterThan(0);
    t.stop();
    expect(t.position()).toBeNull();
  });

  test('a tempo change keeps the position and changes the spacing', () => {
    const p = project();
    p.bpm = 120;
    const { ctx, notes, clicks, sink } = fake();
    const t = new Transport(sink, () => p);
    t.metronome = true;
    t.play('pattern', 'p1');
    ctx.currentTime = 0.4;
    t.pump();
    p.bpm = 60;
    for (let time = 0.425; time < 1.6; time += 0.025) {
      ctx.currentTime = time;
      t.pump();
    }
    const kicks = notes.filter((x) => x.channel === 'kick').map((x) => +x.at.toFixed(3));
    // At 0.425 s the transport is 72 ticks in; the last 24 ticks of beat 1 take 0.25 s at 60 BPM, then 1 s a beat.
    expect(kicks).toEqual([0.05, 0.675, 1.675]);
    expect(clicks.length).toBeGreaterThanOrEqual(2);
  });
});

import { Midi } from '@tonejs/midi';
import { drumForNote, exportMidi, importMidi } from './midi-file';
import { Recorder } from './record';

describe('MIDI files', () => {
  const base = { id: '22222222-2222-4333-8444-555555555555', name: 'Back', now: 'x' };
  const byName = (p: BeatProject) =>
    Object.fromEntries(
      p.channels.map((c) => [
        c.name,
        p.patterns
          .flatMap((pat) => pat.notes[c.id] ?? [])
          .sort((a, b) => a.start - b.start || a.key - b.key)
      ])
    );

  test('a pattern exported to .mid imports back to the same notes', async () => {
    const p = project();
    p.patterns[0].notes.lead = [{ key: 67, start: 30, length: 50, velocity: 77 }];
    const bytes = await exportMidi(p, 'pattern', 'p1');
    const midi = new Midi(bytes);
    expect(midi.tracks.filter((t) => t.channel === 9).length).toBe(4);
    expect(midi.tracks.find((t) => t.name === 'Kick')!.notes[0].midi).toBe(36);
    const back = await importMidi(bytes.buffer, base);
    expect(back.project.bpm).toBe(124);
    expect(back.dropped).toBe(0);
    expect(back.project.patterns).toHaveLength(1);
    expect(back.project.patterns[0].steps).toBe(16);
    const want = byName(p);
    const got = byName(back.project);
    for (const name of ['Kick', 'Clap', 'Hat', 'Snare', 'Bass', 'Lead'])
      expect(got[name]).toEqual(want[name]);
    expect(back.project.channels.map((c) => c.name)).toEqual([
      'Kick',
      'Snare',
      'Clap',
      'Hat',
      'Bass',
      'Lead'
    ]);
    expect(back.project.channels.find((c) => c.name === 'Kick')!.instrument).toMatchObject({
      kind: 'drum',
      drum: 'kick'
    });
  });

  test('a long song splits into 16-bar patterns on the playlist', async () => {
    const midi = new Midi();
    midi.header.setTempo(90);
    const t = midi.addTrack();
    t.name = 'Keys';
    for (let bar = 0; bar < 20; bar++)
      t.addNote({
        midi: 60,
        ticks: bar * 4 * midi.header.ppq,
        durationTicks: midi.header.ppq,
        velocity: 0.8
      });
    const drums = midi.addTrack();
    drums.channel = 9;
    drums.addNote({ midi: 49, ticks: 0, durationTicks: 10, velocity: 1 });
    const out = await importMidi(new Uint8Array(midi.toArray()).buffer, base);
    expect(out.project.bpm).toBe(90);
    expect(out.project.patterns.map((p) => [p.name, p.steps])).toEqual([
      ['Bars 1–16', 256],
      ['Bars 17–20', 64]
    ]);
    expect(out.project.playlist.clips.map((c) => c.start_beat)).toEqual([0, 64]);
    expect(out.project.channels.map((c) => c.name)).toEqual(['Open hat', 'Keys']);
    expect(out.notes).toBe(21);
  });

  test('a stray note far past the playlist is dropped without empty passes', async () => {
    const midi = new Midi();
    const t = midi.addTrack();
    t.addNote({ midi: 60, ticks: 0, durationTicks: 100, velocity: 0.8 });
    t.addNote({ midi: 62, ticks: 2 ** 30, durationTicks: 100, velocity: 0.8 });
    const started = performance.now();
    const out = await importMidi(new Uint8Array(midi.toArray()).buffer, base);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(out.project.patterns).toHaveLength(1);
    expect(out.dropped).toBe(1);
  });

  test('bad and empty files are refused with a plain message', async () => {
    await expect(importMidi(new Uint8Array([1, 2, 3]).buffer, base)).rejects.toThrow(/not a MIDI/);
    const empty = new Midi();
    empty.addTrack();
    await expect(importMidi(new Uint8Array(empty.toArray()).buffer, base)).rejects.toThrow(
      /no notes/
    );
    await expect(
      exportMidi(
        { ...project(), patterns: [{ id: 'p1', name: 'E', steps: 16, notes: {} }] },
        'pattern',
        'p1'
      )
    ).rejects.toThrow(/Nothing/);
  });

  test('GM drums map to drum synths', () => {
    expect([35, 36, 38, 39, 42, 46, 45, 49, 56, 76].map(drumForNote)).toEqual([
      'kick',
      'kick',
      'snare',
      'clap',
      'hat',
      'openhat',
      'tom',
      'openhat',
      'perc',
      'perc'
    ]);
  });
});

describe('recording', () => {
  test('notes land where they were played, quantised when asked', () => {
    const r = new Recorder(384, 24);
    r.noteOn('a', 60, 100, 50);
    expect(r.noteOff('a', 95)).toEqual({ key: 60, start: 48, length: 48, velocity: 100 });
    r.noteOn('b', 62, 90, 5);
    expect(r.noteOff('b', 8)).toEqual({ key: 62, start: 0, length: 24, velocity: 90 });
    expect(r.noteOff('unknown', 10)).toBeNull();
  });

  test('a note held over the loop point wraps, and stop closes held notes', () => {
    const r = new Recorder(384, 1);
    r.noteOn('a', 60, 100, 370);
    expect(r.noteOff('a', 20)).toEqual({ key: 60, start: 370, length: 34, velocity: 100 });
    r.noteOn('b', 64, 80, 380);
    r.noteOn('c', 67, 80, 100);
    expect(r.flush(200)).toEqual([
      { id: 'b', note: { key: 64, start: 380, length: 204, velocity: 80 } },
      { id: 'c', note: { key: 67, start: 100, length: 100, velocity: 80 } }
    ]);
    // A start quantised up to the loop end wraps to 0.
    const q = new Recorder(384, 96);
    q.noteOn('d', 60, 100, 370);
    expect(q.noteOff('d', 380)?.start).toBe(0);
  });
});

import { beatTitle, uploadBeat } from './send';

describe('send to Create', () => {
  test('titles name the project and, for a pattern, the pattern', () => {
    expect(beatTitle('Night Drive', '')).toBe('Night Drive');
    expect(beatTitle('  ', 'Pattern 2')).toBe('Untitled beat (Pattern 2)');
    expect(beatTitle('x'.repeat(200), '').length).toBe(100);
  });

  test('uploads the WAV as a beat with the intent header, and reports refusals', async () => {
    const realFetch = globalThis.fetch;
    const seen: { url: string; init: RequestInit }[] = [];
    try {
      globalThis.fetch = (async (url: string, init: RequestInit) => {
        seen.push({ url, init });
        return Response.json({ song: { id: 's1', title: 'T' } }, { status: 201 });
      }) as unknown as typeof fetch;
      const song = await uploadBeat(new Blob(['RIFF'], { type: 'audio/wav' }), 'T');
      expect(song.id).toBe('s1');
      expect(seen[0].url).toBe('/api/studio/uploads');
      expect((seen[0].init.headers as Record<string, string>)['x-vbm-intent']).toBe('upload');
      const form = seen[0].init.body as FormData;
      expect([form.get('type'), form.get('title'), form.get('rights')]).toEqual([
        'beat',
        'T',
        'true'
      ]);
      expect((form.get('file') as File).name).toBe('beat.wav');
      globalThis.fetch = (async () =>
        Response.json({ detail: 'Too big.' }, { status: 413 })) as unknown as typeof fetch;
      await expect(uploadBeat(new Blob([]), 'T')).rejects.toThrow('Too big.');
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
