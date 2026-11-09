import { Note, Scale } from 'tonal';

export const riffKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const riffScales = ['minor pentatonic', 'minor', 'major'] as const;
export type RiffSettings = {
  key: string;
  scale: string;
  bpm: number;
  bars: number;
  instrument: 'guitar' | 'bass' | 'keys';
  density: 'sparse' | 'steady' | 'busy';
  swing: boolean;
};
export type RiffStep = { midi: number | null; velocity: number; locked: boolean };
export type RiffDraft = { version: 1; settings: RiffSettings; steps: RiffStep[]; seed: number };
export const defaultRiffSettings: RiffSettings = {
  key: 'E',
  scale: 'minor pentatonic',
  bpm: 120,
  bars: 4,
  instrument: 'guitar',
  density: 'steady',
  swing: false
};
export function validSettings(s: unknown): s is RiffSettings {
  if (!s || typeof s !== 'object') return false;
  const v = s as RiffSettings;
  return (
    riffKeys.includes(v.key as (typeof riffKeys)[number]) &&
    riffScales.includes(v.scale as (typeof riffScales)[number]) &&
    Number.isInteger(v.bpm) &&
    v.bpm >= 60 &&
    v.bpm <= 180 &&
    [2, 4, 8].includes(v.bars) &&
    ['guitar', 'bass', 'keys'].includes(v.instrument) &&
    ['sparse', 'steady', 'busy'].includes(v.density) &&
    typeof v.swing === 'boolean'
  );
}
export function readRiffDraft(text: string): RiffDraft | null {
  if (text.length > 20000) return null;
  try {
    const d = JSON.parse(text) as RiffDraft;
    if (
      d.version !== 1 ||
      !validSettings(d.settings) ||
      !Number.isInteger(d.seed) ||
      !Array.isArray(d.steps) ||
      d.steps.length !== d.settings.bars * 8
    )
      return null;
    if (
      !d.steps.every(
        (s) =>
          s &&
          (s.midi === null || (Number.isInteger(s.midi) && s.midi >= 24 && s.midi <= 96)) &&
          typeof s.velocity === 'number' &&
          Number.isFinite(s.velocity) &&
          s.velocity >= 0.1 &&
          s.velocity <= 1 &&
          typeof s.locked === 'boolean'
      )
    )
      return null;
    return d;
  } catch {
    return null;
  }
}
export function riffNotes(s: RiffSettings): number[] {
  const octave = s.instrument === 'bass' ? 2 : s.instrument === 'guitar' ? 3 : 4;
  const notes = Scale.get(s.key + octave + ' ' + s.scale)
    .notes.map((n) => Note.midi(n))
    .filter((n): n is number => n !== null);
  return [...notes, ...notes.map((n) => n + 12)];
}
/** Procedural, reproducible note generation. Not an AI/model call. */
export function generateRiff(
  settings: RiffSettings,
  seed: number,
  previous: RiffStep[] = []
): RiffDraft {
  if (!validSettings(settings) || !Number.isInteger(seed)) throw Error('Invalid riff settings.');
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const notes = riffNotes(settings),
    density = { sparse: 0.4, steady: 0.7, busy: 0.95 }[settings.density];
  let degree = 0;
  const motif = Array.from({ length: 16 }, (_, i): RiffStep => {
    degree =
      i % 8 === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              notes.length - 1,
              degree + (random() < 0.5 ? -1 : 1) * (random() < 0.8 ? 1 : 2)
            )
          );
    return {
      midi: i % 8 !== 0 && random() > density ? null : notes[degree],
      velocity: i % 2 === 0 ? 0.85 : 0.65,
      locked: false
    };
  });
  const steps = Array.from({ length: settings.bars * 8 }, (_, i) => {
    if (previous[i]?.locked) return { ...previous[i] };
    const step = { ...motif[i % 16] };
    // One small turnaround per alternate two-bar phrase; most of the motif repeats.
    if (i >= 16 && i % 16 === 14 && step.midi !== null)
      step.midi = notes[Math.floor(random() * notes.length)];
    return step;
  });
  return { version: 1, settings: { ...settings }, steps, seed };
}
export function riffEvents(draft: RiffDraft) {
  const beat = 60 / draft.settings.bpm;
  return draft.steps.flatMap((step, i) =>
    step.midi === null
      ? []
      : [
          {
            midi: step.midi,
            velocity: step.velocity,
            time: (i * 0.5 + (draft.settings.swing && i % 2 ? 0.12 : 0)) * beat,
            duration: beat * (draft.settings.instrument === 'keys' ? 0.4 : 0.32)
          }
        ]
  );
}
export async function riffMidi(draft: RiffDraft): Promise<Uint8Array<ArrayBuffer>> {
  const { Midi } = await import('@tonejs/midi');
  const midi = new Midi();
  midi.header.setTempo(draft.settings.bpm);
  const track = midi.addTrack();
  track.name = 'VBM riff';
  track.instrument.number = { guitar: 27, bass: 33, keys: 0 }[draft.settings.instrument];
  for (const event of riffEvents(draft)) track.addNote(event);
  return new Uint8Array(midi.toArray());
}
export const riffNoteName = (midi: number | null) => (midi === null ? 'Rest' : Note.fromMidi(midi));
