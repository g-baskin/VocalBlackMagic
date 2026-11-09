import { Note, Scale } from 'tonal';
import { readRiffDraft, riffEvents, type RiffDraft } from './riff';

export const sectionNames = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'] as const;
export const trackNames = ['riff', 'bass', 'chords', 'drums'] as const;
export type ArrangementTrack = (typeof trackNames)[number];
export type ArrangementSection = {
  name: (typeof sectionNames)[number];
  bars: number;
  chord: number;
  energy: 'quiet' | 'full';
};
export type Arrangement = {
  version: 1;
  title: string;
  source: RiffDraft;
  groove: 'straight' | 'half-time';
  sections: ArrangementSection[];
  levels: Record<ArrangementTrack, number>;
};
export const arrangementLimitSeconds = 180;
export function arrangementSeconds(p: Arrangement): number {
  return (p.sections.reduce((sum, s) => sum + s.bars, 0) * 240) / p.source.settings.bpm;
}
export function arrangementIssue(p: Arrangement): string | null {
  if (!p.source.steps.some((s) => s.midi !== null)) return 'Add a note to the source riff first.';
  if (arrangementSeconds(p) > arrangementLimitSeconds)
    return 'Shorten the sections to 180 seconds or less for browser rendering.';
  if (trackNames.every((t) => p.levels[t] === 0)) return 'Turn up at least one track.';
  return null;
}
/** Allowlisted, size-bounded project data only; never deserialize executable audio graphs. */
export function readArrangement(text: string): Arrangement | null {
  if (text.length > 50000) return null;
  try {
    const p = JSON.parse(text) as Arrangement;
    const source = readRiffDraft(JSON.stringify(p.source));
    if (
      p.version !== 1 ||
      !source ||
      typeof p.title !== 'string' ||
      p.title.length > 120 ||
      !['straight', 'half-time'].includes(p.groove) ||
      !Array.isArray(p.sections) ||
      p.sections.length < 1 ||
      p.sections.length > 8 ||
      !p.levels ||
      !trackNames.every(
        (t) => Number.isInteger(p.levels[t]) && p.levels[t] >= 0 && p.levels[t] <= 100
      ) ||
      !p.sections.every(
        (s) =>
          s &&
          sectionNames.includes(s.name) &&
          [2, 4, 8, 16].includes(s.bars) &&
          Number.isInteger(s.chord) &&
          s.chord >= 0 &&
          s.chord <= 6 &&
          ['quiet', 'full'].includes(s.energy)
      )
    )
      return null;
    return {
      version: 1,
      title: p.title,
      source,
      groove: p.groove,
      levels: {
        riff: p.levels.riff,
        bass: p.levels.bass,
        chords: p.levels.chords,
        drums: p.levels.drums
      },
      sections: p.sections.map(({ name, bars, chord, energy }) => ({ name, bars, chord, energy }))
    };
  } catch {
    return null;
  }
}
export function createArrangement(source: RiffDraft, title = 'My riff arrangement'): Arrangement {
  const checked = readRiffDraft(JSON.stringify(source));
  if (!checked || !checked.steps.some((s) => s.midi !== null))
    throw Error('Add a valid source riff first.');
  return {
    version: 1,
    title: title.slice(0, 120),
    source: checked,
    groove: 'straight',
    levels: { riff: 80, bass: 65, chords: 45, drums: 65 },
    sections: [
      { name: 'Intro', bars: 2, chord: 0, energy: 'quiet' },
      { name: 'Verse', bars: 4, chord: 0, energy: 'full' },
      { name: 'Chorus', bars: 8, chord: 5, energy: 'full' },
      { name: 'Bridge', bars: 4, chord: 3, energy: 'quiet' },
      { name: 'Chorus', bars: 8, chord: 0, energy: 'full' },
      { name: 'Outro', bars: 2, chord: 0, energy: 'quiet' }
    ]
  };
}
export function arrangementChord(p: Arrangement, degree: number): number[] {
  const scale = Scale.get(
    p.source.settings.key + '3 ' + (p.source.settings.scale === 'major' ? 'major' : 'minor')
  );
  const notes = scale.notes.map((n) => Note.midi(n)!);
  return [0, 2, 4].map(
    (offset) => notes[(degree + offset) % 7] + Math.floor((degree + offset) / 7) * 12
  );
}
export function chordLabel(p: Arrangement, degree: number): string {
  const [root, third, fifth] = arrangementChord(p, degree);
  return (
    Scale.get(
      p.source.settings.key + ' ' + (p.source.settings.scale === 'major' ? 'major' : 'minor')
    ).notes[degree] + (fifth - root === 6 ? ' dim' : third - root === 3 ? ' minor' : ' major')
  );
}
export type ArrangementNote = { midi: number; time: number; duration: number; velocity: number };
export function arrangementEvents(
  project: Arrangement
): Record<ArrangementTrack, ArrangementNote[]> {
  const p = readArrangement(JSON.stringify(project));
  if (!p) throw Error('Invalid arrangement project.');
  const issue = arrangementIssue(p);
  if (issue) throw Error(issue);
  const beat = 60 / p.source.settings.bpm;
  const source = riffEvents(p.source);
  const loop = p.source.settings.bars * 4 * beat;
  const tracks: Record<ArrangementTrack, ArrangementNote[]> = {
    riff: [],
    bass: [],
    chords: [],
    drums: []
  };
  let start = 0;
  for (const section of p.sections) {
    const length = section.bars * 4 * beat;
    const strength = section.energy === 'quiet' ? 0.55 : 1;
    const add = (
      track: ArrangementTrack,
      midi: number,
      time: number,
      duration: number,
      velocity: number
    ) => {
      if (!p.levels[track] || time >= start + length) return;
      tracks[track].push({
        midi,
        time,
        duration: Math.min(duration, start + length - time),
        velocity: (velocity * strength * p.levels[track]) / 100
      });
    };
    // Preserve source pitch and timing, including rests and swing. No chord-driven transposition.
    for (let at = 0; at < length - 0.00001; at += loop)
      for (const note of source)
        add('riff', note.midi, start + at + note.time, note.duration, note.velocity);
    const chord = arrangementChord(p, section.chord);
    for (let bar = 0; bar < section.bars; bar++) {
      const at = start + bar * 4 * beat;
      for (const midi of chord) add('chords', midi, at, beat * 3.8, 0.65);
      for (let b = 0; b < 4; b++) {
        add('bass', chord[b === 3 ? 2 : 0] - 12, at + b * beat, beat * 0.7, b % 2 ? 0.65 : 0.85);
        if (b === 0 || (p.groove === 'straight' && b === 2))
          add('drums', 36, at + b * beat, beat * 0.3, 0.9);
        if (p.groove === 'half-time' ? b === 2 : b % 2 === 1)
          add('drums', 38, at + b * beat, beat * 0.2, 0.75);
      }
      for (let tick = 0; tick < 8; tick++) {
        if (section.energy === 'quiet' && tick % 2) continue;
        const swing = p.source.settings.swing && tick % 2 ? 0.12 : 0;
        add('drums', 42, at + (tick * 0.5 + swing) * beat, beat * 0.12, tick % 2 ? 0.3 : 0.45);
      }
    }
    start += length;
  }
  for (const notes of Object.values(tracks))
    notes.sort((a, b) => a.time - b.time || a.midi - b.midi);
  return tracks;
}
export async function arrangementMidi(p: Arrangement): Promise<Uint8Array<ArrayBuffer>> {
  const events = arrangementEvents(p);
  const { Midi } = await import('@tonejs/midi');
  const midi = new Midi();
  midi.header.setTempo(p.source.settings.bpm);
  const programs = {
    riff: { guitar: 27, bass: 33, keys: 0 }[p.source.settings.instrument],
    bass: 33,
    chords: 0,
    drums: 0
  };
  trackNames.forEach((name, i) => {
    const track = midi.addTrack();
    track.name = name;
    track.channel = name === 'drums' ? 9 : i;
    track.instrument.number = programs[name];
    for (const note of events[name]) track.addNote(note);
    // @tonejs/midi does not encode endOfTrackTicks. A real all-notes-off event
    // retains trailing rests and the same section boundary on every exported track.
    const endTicks = Math.round(p.sections.reduce((n, s) => n + s.bars, 0) * 4 * midi.header.ppq);
    track.addCC({ number: 123, value: 0, ticks: endTicks });
  });
  return new Uint8Array(midi.toArray());
}
