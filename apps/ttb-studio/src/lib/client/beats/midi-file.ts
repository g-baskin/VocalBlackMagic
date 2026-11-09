import {
  barTicks,
  beatLimits,
  defaultSynth,
  drumKinds,
  newChannel,
  newPattern,
  patternStepOptions,
  patternTicks,
  ppq,
  stepTicks,
  validateBeatProject,
  type BeatChannel,
  type BeatNote,
  type BeatPattern,
  type BeatProject,
  type DrumKind,
  type PatternSteps
} from '@vbm/contracts';
import type { PlayMode } from './schedule';

/** General MIDI drum note for each drum synth (channel 10). */
export const gmDrumNote: Record<DrumKind, number> = {
  kick: 36,
  snare: 38,
  clap: 39,
  hat: 42,
  openhat: 46,
  tom: 45,
  perc: 56
};

/** Which drum synth plays a GM drum note. */
export function drumForNote(note: number): DrumKind {
  if (note === 35 || note === 36) return 'kick';
  if (note === 38 || note === 40) return 'snare';
  if (note === 39) return 'clap';
  if (note === 42 || note === 44) return 'hat';
  if (note === 46 || [49, 51, 52, 53, 55, 57, 59].includes(note)) return 'openhat';
  if ([41, 43, 45, 47, 48, 50].includes(note)) return 'tom';
  return 'perc';
}

const drumNames: Record<DrumKind, string> = {
  kick: 'Kick',
  snare: 'Snare',
  clap: 'Clap',
  hat: 'Hat',
  openhat: 'Open hat',
  tom: 'Tom',
  perc: 'Perc'
};

/** Notes of one pass of the pattern or song, straight (no swing), in project ticks. */
function passNotes(
  project: BeatProject,
  mode: PlayMode,
  patternId: string
): { notes: Map<string, BeatNote[]>; end: number } {
  const notes = new Map<string, BeatNote[]>();
  const add = (p: BeatPattern, offset: number) => {
    for (const [channel, list] of Object.entries(p.notes)) {
      const out = notes.get(channel) ?? [];
      for (const n of list) out.push({ ...n, start: n.start + offset });
      notes.set(channel, out);
    }
  };
  const byId = new Map(project.patterns.map((p) => [p.id, p]));
  let end = 0;
  if (mode === 'pattern') {
    const p = byId.get(patternId);
    if (p) {
      add(p, 0);
      end = patternTicks(p);
    }
  } else
    for (const clip of project.playlist.clips) {
      const p = byId.get(clip.pattern_id);
      if (!p) continue;
      add(p, clip.start_beat * ppq);
      end = Math.max(end, clip.start_beat * ppq + patternTicks(p));
    }
  return { notes, end: Math.ceil(end / barTicks) * barTicks };
}

/** The pattern or song as a Standard MIDI File: one track per channel, drums on channel 10. */
export async function exportMidi(
  project: BeatProject,
  mode: PlayMode,
  patternId: string
): Promise<Uint8Array<ArrayBuffer>> {
  const { notes, end } = passNotes(project, mode, patternId);
  if (![...notes.values()].some((l) => l.length))
    throw new Error('Nothing to export: no channel has notes here.');
  // Loaded on demand: the MIDI library is CommonJS and breaks server-side rendering.
  const { Midi } = await import('@tonejs/midi');
  const midi = new Midi();
  midi.header.setTempo(project.bpm);
  const scale = midi.header.ppq / ppq;
  let melodic = 0;
  for (const channel of project.channels) {
    const list = notes.get(channel.id) ?? [];
    if (!list.length) continue;
    const track = midi.addTrack();
    track.name = channel.name;
    const drum = channel.instrument.kind === 'drum' ? channel.instrument.drum : null;
    if (drum) {
      track.channel = 9;
      track.instrument.number = 0;
    } else {
      track.channel = melodic % 15 >= 9 ? (melodic % 15) + 1 : melodic % 15;
      melodic += 1;
      track.instrument.number = channel.instrument.kind === 'synth' ? 81 : 0;
    }
    for (const n of list)
      track.addNote({
        midi: drum
          ? Math.min(127, Math.max(0, gmDrumNote[drum] + n.key - channel.root_key))
          : n.key,
        ticks: Math.round(n.start * scale),
        durationTicks: Math.max(1, Math.round(n.length * scale)),
        velocity: n.velocity / 127
      });
    // @tonejs/midi does not write an end-of-track time; an all-notes-off keeps the full length.
    track.addCC({ number: 123, value: 0, ticks: Math.round(end * scale) });
  }
  return new Uint8Array(midi.toArray());
}

/** Bars per imported pattern; longer files are split and laid out on the playlist. */
export const importBarsPerPattern = 16;

const fitSteps = (ticks: number): PatternSteps =>
  patternStepOptions.find((s) => s * stepTicks >= ticks) ??
  patternStepOptions[patternStepOptions.length - 1];

/**
 * Builds a new project from a MIDI file. Notes are quantised to project ticks; channel 10
 * becomes one drum synth per kind; other tracks become 3-osc synths.
 */
export async function importMidi(
  bytes: ArrayBuffer,
  base: { id: string; name: string; now: string }
): Promise<{ project: BeatProject; notes: number; dropped: number }> {
  const { Midi } = await import('@tonejs/midi');
  let midi: InstanceType<typeof Midi>;
  try {
    midi = new Midi(bytes);
  } catch {
    throw new Error('This file is not a MIDI file this studio can read.');
  }
  const total = midi.tracks.reduce((n, t) => n + t.notes.length, 0);
  if (!total) throw new Error('This MIDI file has no notes.');
  if (total > beatLimits.notes)
    throw new Error(
      'This MIDI file has ' +
        total.toLocaleString('en') +
        ' notes; a project holds at most ' +
        beatLimits.notes.toLocaleString('en') +
        '.'
    );
  const scale = ppq / midi.header.ppq;
  const tempo = midi.header.tempos[0]?.bpm ?? 120;
  const bpm = Math.min(240, Math.max(40, Math.round(tempo)));

  // Gather notes per channel key: "d:<kind>" for drums, "t:<track>" for the rest.
  const groups = new Map<string, { name: string; drum: DrumKind | null; notes: BeatNote[] }>();
  midi.tracks.forEach((track, t) => {
    const drums = track.channel === 9 || track.instrument.percussion;
    for (const n of track.notes) {
      const start = Math.max(0, Math.round(n.ticks * scale));
      const length = Math.max(1, Math.round(n.durationTicks * scale));
      const velocity = Math.min(127, Math.max(1, Math.round(n.velocity * 127)));
      const kind = drums ? drumForNote(n.midi) : null;
      const id = kind ? 'd:' + kind : 't:' + t;
      const group = groups.get(id) ?? {
        name: kind ? drumNames[kind] : track.name || track.instrument.name || 'Track ' + (t + 1),
        drum: kind,
        notes: []
      };
      // Toms keep their pitch; other drums sit on the root key so they show as steps.
      const key = kind === 'tom' ? 60 + n.midi - gmDrumNote.tom : kind ? 60 : n.midi;
      group.notes.push({ key: Math.min(127, Math.max(0, key)), start, length, velocity });
      groups.set(id, group);
    }
  });

  const ordered = [...groups.values()].sort(
    (a, b) =>
      Number(!a.drum) - Number(!b.drum) ||
      (a.drum && b.drum ? drumKinds.indexOf(a.drum) - drumKinds.indexOf(b.drum) : 0) ||
      a.name.localeCompare(b.name)
  );
  const kept = ordered.slice(0, beatLimits.channels);
  let dropped = ordered.slice(beatLimits.channels).reduce((n, g) => n + g.notes.length, 0);

  const channels: BeatChannel[] = kept.map((g, i) => {
    const id = 'ch' + (i + 1);
    const name = g.name.trim().slice(0, 40) || 'Channel ' + (i + 1);
    if (g.drum)
      return newChannel(id, name, { kind: 'drum', drum: g.drum, tune_st: 0, decay: 1 }, i);
    const keys = g.notes.map((n) => n.key).sort((a, b) => a - b);
    const synth = defaultSynth();
    return newChannel(id, name, { kind: 'synth', synth }, i, keys[Math.floor(keys.length / 2)]);
  });

  const chunk = importBarsPerPattern * barTicks;
  const patterns: BeatPattern[] = [];
  const clips: BeatProject['playlist']['clips'] = [];
  // Only chunks that hold notes, so a stray far-off note cannot make thousands of empty passes.
  const lastChunk = Math.floor((beatLimits.maxStartBeat * ppq) / chunk);
  const used = [
    ...new Set(kept.flatMap((g) => g.notes.map((n) => Math.floor(n.start / chunk))))
  ].sort((a, b) => a - b);
  for (const c of used) {
    const from = c * chunk;
    if (c > lastChunk) {
      dropped += kept.reduce(
        (n, g) => n + g.notes.filter((x) => x.start >= from && x.start < from + chunk).length,
        0
      );
      continue;
    }
    const inChunk = kept.flatMap((g) =>
      g.notes.filter((n) => n.start >= from && n.start < from + chunk)
    );
    const length = Math.max(...inChunk.map((n) => n.start - from + 1));
    const pattern = newPattern('p' + (patterns.length + 1), '', fitSteps(length));
    const ticks = patternTicks(pattern);
    let any = false;
    kept.forEach((g, i) => {
      const list = g.notes
        .filter((n) => n.start >= from && n.start < from + ticks)
        .map((n) => ({ ...n, start: n.start - from, length: Math.min(n.length, ticks) }));
      if (list.length) {
        pattern.notes[channels[i].id] = list.sort((a, b) => a.start - b.start || a.key - b.key);
        any = true;
      }
    });
    if (!any) continue;
    if (patterns.length >= beatLimits.patterns) {
      dropped += Object.values(pattern.notes).reduce((n, l) => n + l.length, 0);
      continue;
    }
    pattern.name =
      used.length === 1 && c === 0
        ? 'Pattern 1'
        : 'Bars ' +
          (c * importBarsPerPattern + 1) +
          '–' +
          (c * importBarsPerPattern + ticks / barTicks);
    patterns.push(pattern);
    clips.push({ pattern_id: pattern.id, track: 0, start_beat: from / ppq });
  }

  const project: BeatProject = {
    schema: 1,
    id: base.id,
    name: base.name.trim().slice(0, 80) || 'Imported MIDI',
    bpm,
    swing: 0,
    ppq,
    created_at: base.now,
    updated_at: base.now,
    channels,
    patterns,
    playlist: { clips },
    master_db: 0
  };
  const invalid = validateBeatProject(project);
  if (invalid) throw new Error('This MIDI file could not be turned into a project: ' + invalid);
  return {
    project,
    notes: patterns.reduce(
      (n, p) => n + Object.values(p.notes).reduce((m, l) => m + l.length, 0),
      0
    ),
    dropped
  };
}
