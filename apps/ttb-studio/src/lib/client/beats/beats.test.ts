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
