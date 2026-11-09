import { isSoundId } from './sampler';

/* ---- Beats: a step sequencer, piano roll and playlist in the TTB Studio browser. ---- */

export const beatSchema = 1;
/** Ticks per quarter note. A 16th step is 24 ticks. */
export const ppq = 96;
export const stepTicks = ppq / 4;
export const barTicks = ppq * 4;
export const patternStepOptions = [16, 32, 64, 128, 256] as const;
export type PatternSteps = (typeof patternStepOptions)[number];

export const beatLimits = {
  channels: 32,
  patterns: 99,
  tracks: 16,
  clips: 512,
  notes: 20000,
  /** Latest clip start, in beats (256 bars). */
  maxStartBeat: 1024
} as const;

export const oscWaves = ['sine', 'triangle', 'sawtooth', 'square'] as const;
export type OscWave = (typeof oscWaves)[number];
export const drumKinds = ['kick', 'snare', 'clap', 'hat', 'openhat', 'tom', 'perc'] as const;
export type DrumKind = (typeof drumKinds)[number];
export const samplerModes = ['one-shot', 'gate'] as const;
export type SamplerMode = (typeof samplerModes)[number];

export interface SynthOsc {
  wave: OscWave;
  /** Semitones, -24 to 24. */
  coarse: number;
  /** Cents, -100 to 100. */
  fine: number;
  /** 0 to 1; 0 switches the oscillator off. */
  level: number;
}

export interface SynthParams {
  osc: SynthOsc[];
  attack_ms: number;
  decay_ms: number;
  sustain: number;
  release_ms: number;
  cutoff_hz: number;
  reso: number;
  /** One note at a time; a new note glides from the last one. */
  mono: boolean;
  glide_ms: number;
}

export type BeatInstrument =
  | { kind: 'synth'; synth: SynthParams }
  | { kind: 'drum'; drum: DrumKind; tune_st: number; decay: number }
  | { kind: 'sampler'; sound_id: string | null; mode: SamplerMode };
export type InstrumentKind = BeatInstrument['kind'];

export interface MixerStrip {
  volume_db: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

export interface BeatChannel {
  id: string;
  name: string;
  colour: string;
  /** The key a step plays, and the key at which a sample sounds at its own pitch. */
  root_key: number;
  instrument: BeatInstrument;
  mixer: MixerStrip;
}

export interface BeatNote {
  key: number;
  /** Ticks from the pattern start. */
  start: number;
  length: number;
  velocity: number;
}

export interface BeatPattern {
  id: string;
  name: string;
  steps: PatternSteps;
  /** Notes per channel id; steps and the piano roll share these. */
  notes: Record<string, BeatNote[]>;
}

export interface PlaylistClip {
  pattern_id: string;
  track: number;
  start_beat: number;
}

export interface BeatProject {
  schema: typeof beatSchema;
  id: string;
  name: string;
  bpm: number;
  /** 0 to 75: how far the second 16th of each pair is pushed late, in % of half a step. */
  swing: number;
  ppq: typeof ppq;
  created_at: string;
  updated_at: string;
  channels: BeatChannel[];
  patterns: BeatPattern[];
  playlist: { clips: PlaylistClip[] };
  master_db: number;
}

export interface BeatProjectSummary {
  id: string;
  name: string;
  bpm: number;
  updated_at: string;
  channels: number;
  patterns: number;
}

/* ---- Ticks and steps ---- */

export const patternTicks = (pattern: Pick<BeatPattern, 'steps'>) => pattern.steps * stepTicks;

/** The note a step stands for: the channel's root key starting exactly on the step. */
export function stepIndex(
  pattern: BeatPattern,
  channel: Pick<BeatChannel, 'id' | 'root_key'>,
  step: number
): number {
  const notes = pattern.notes[channel.id] ?? [];
  return notes.findIndex((n) => n.key === channel.root_key && n.start === step * stepTicks);
}

export function stepOn(
  pattern: BeatPattern,
  channel: Pick<BeatChannel, 'id' | 'root_key'>,
  step: number
): boolean {
  return stepIndex(pattern, channel, step) >= 0;
}

/** Adds or removes a step note in place; returns whether the step is now on. */
export function toggleStep(
  pattern: BeatPattern,
  channel: Pick<BeatChannel, 'id' | 'root_key'>,
  step: number,
  velocity = 100
): boolean {
  const notes = (pattern.notes[channel.id] ??= []);
  const at = stepIndex(pattern, channel, step);
  if (at >= 0) {
    notes.splice(at, 1);
    return false;
  }
  notes.push({ key: channel.root_key, start: step * stepTicks, length: stepTicks, velocity });
  notes.sort((a, b) => a.start - b.start || a.key - b.key);
  return true;
}

/** Song length in ticks: the end of the last clip, rounded up to a whole bar. */
export function songTicks(project: Pick<BeatProject, 'patterns' | 'playlist'>): number {
  const byId = new Map(project.patterns.map((p) => [p.id, p]));
  let end = 0;
  for (const clip of project.playlist.clips) {
    const p = byId.get(clip.pattern_id);
    if (p) end = Math.max(end, clip.start_beat * ppq + patternTicks(p));
  }
  return Math.ceil(end / barTicks) * barTicks;
}

export const noteCount = (project: Pick<BeatProject, 'patterns'>) =>
  project.patterns.reduce(
    (n, p) => n + Object.values(p.notes).reduce((m, list) => m + list.length, 0),
    0
  );

/* ---- New projects ---- */

export const channelColours = [
  '#ff5a5f',
  '#ff9f43',
  '#ffd166',
  '#3ff0d2',
  '#5fa8ff',
  '#a77bff',
  '#ff6fb5',
  '#9be15d'
];

export function defaultSynth(): SynthParams {
  return {
    osc: [
      { wave: 'sawtooth', coarse: 0, fine: 0, level: 0.7 },
      { wave: 'sawtooth', coarse: 0, fine: 7, level: 0.5 },
      { wave: 'square', coarse: -12, fine: 0, level: 0 }
    ],
    attack_ms: 4,
    decay_ms: 220,
    sustain: 0.6,
    release_ms: 180,
    cutoff_hz: 3200,
    reso: 1,
    mono: false,
    glide_ms: 60
  };
}

export function defaultInstrument(kind: InstrumentKind): BeatInstrument {
  if (kind === 'synth') return { kind, synth: defaultSynth() };
  if (kind === 'drum') return { kind, drum: 'kick', tune_st: 0, decay: 1 };
  return { kind, sound_id: null, mode: 'one-shot' };
}

export const defaultStrip = (): MixerStrip => ({ volume_db: -3, pan: 0, mute: false, solo: false });

export function newChannel(
  id: string,
  name: string,
  instrument: BeatInstrument,
  index: number,
  rootKey = 60
): BeatChannel {
  return {
    id,
    name,
    colour: channelColours[index % channelColours.length],
    root_key: rootKey,
    instrument,
    mixer: defaultStrip()
  };
}

export function newPattern(id: string, name: string, steps: PatternSteps = 16): BeatPattern {
  return { id, name, steps, notes: {} };
}

const steps = (list: number[], velocity = 100, key = 60): BeatNote[] =>
  list.map((s) => ({ key, start: s * stepTicks, length: stepTicks, velocity }));

/** A starter kit and a four-on-the-floor beat, so the first press of Play makes sound. */
export function newBeatProject(id: string, name: string, now: string): BeatProject {
  const drum = (d: DrumKind): BeatInstrument => ({ kind: 'drum', drum: d, tune_st: 0, decay: 1 });
  const bass = defaultSynth();
  bass.osc = [
    { wave: 'sawtooth', coarse: 0, fine: 0, level: 0.6 },
    { wave: 'square', coarse: -12, fine: 0, level: 0.5 },
    { wave: 'sine', coarse: 0, fine: 0, level: 0 }
  ];
  Object.assign(bass, { cutoff_hz: 900, reso: 2, sustain: 0.7, release_ms: 90, mono: true });
  const lead = defaultSynth();
  Object.assign(lead, { cutoff_hz: 5000, release_ms: 260 });
  const channels = [
    newChannel('kick', 'Kick', drum('kick'), 0),
    newChannel('clap', 'Clap', drum('clap'), 1),
    newChannel('hat', 'Hat', drum('hat'), 2),
    newChannel('snare', 'Snare', drum('snare'), 3),
    newChannel('bass', 'Bass', { kind: 'synth', synth: bass }, 4, 36),
    newChannel('lead', 'Lead', { kind: 'synth', synth: lead }, 5, 60)
  ];
  channels[2].mixer.volume_db = -9;
  channels[3].mixer.volume_db = -8;
  channels[5].mixer.volume_db = -10;
  const pattern = newPattern('p1', 'Pattern 1');
  pattern.notes = {
    kick: steps([0, 4, 8, 12], 110),
    clap: steps([4, 12]),
    hat: [...steps([2, 6, 10, 14], 96), ...steps([0, 4, 8, 12], 52)].sort(
      (a, b) => a.start - b.start
    ),
    snare: steps([7, 15], 50),
    bass: [
      { key: 36, start: 0, length: 36, velocity: 100 },
      { key: 36, start: 72, length: 24, velocity: 90 },
      { key: 48, start: 120, length: 24, velocity: 84 },
      { key: 36, start: 192, length: 36, velocity: 100 },
      { key: 39, start: 264, length: 24, velocity: 90 },
      { key: 41, start: 312, length: 48, velocity: 96 }
    ]
  };
  return {
    schema: beatSchema,
    id,
    name,
    bpm: 124,
    swing: 0,
    ppq,
    created_at: now,
    updated_at: now,
    channels,
    patterns: [pattern],
    playlist: { clips: [{ pattern_id: 'p1', track: 0, start_beat: 0 }] },
    master_db: 0
  };
}

/* ---- Validation (shared by UI and server; ranges are refused, never silently clamped) ---- */

export const isBeatId = isSoundId;
const partId = /^[A-Za-z0-9_-]{1,40}$/;
// Ids key plain objects, so names like __proto__ or constructor are refused.
export const isPartId = (v: unknown): v is string =>
  typeof v === 'string' && partId.test(v) && !(v in Object.prototype);

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const inRange = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const isInt = (v: unknown, lo: number, hi: number): v is number =>
  Number.isInteger(v) && inRange(v, lo, hi);
const oneOf = (v: unknown, list: readonly (string | number)[]) =>
  (typeof v === 'string' || typeof v === 'number') && list.includes(v);
const isName = (v: unknown, max: number): v is string =>
  typeof v === 'string' && !!v.trim() && v.length <= max;

function validateInstrument(i: unknown, where: string): string | null {
  if (!isObject(i)) return where + ' has no instrument.';
  if (i.kind === 'drum') {
    if (!oneOf(i.drum, drumKinds)) return where + ' has an unknown drum.';
    if (!inRange(i.tune_st, -24, 24)) return where + ' drum tune must be -24 to 24 semitones.';
    if (!inRange(i.decay, 0.1, 4)) return where + ' drum decay must be 0.1 to 4.';
    return null;
  }
  if (i.kind === 'sampler') {
    if (i.sound_id !== null && !isSoundId(i.sound_id)) return where + ' sound id is not valid.';
    if (!oneOf(i.mode, samplerModes)) return where + ' sampler mode must be one-shot or gate.';
    return null;
  }
  if (i.kind !== 'synth') return where + ' has an unknown instrument.';
  const s = i.synth;
  if (!isObject(s)) return where + ' synth settings are missing.';
  if (!Array.isArray(s.osc) || s.osc.length !== 3) return where + ' synth needs 3 oscillators.';
  for (const o of s.osc as unknown[])
    if (
      !isObject(o) ||
      !oneOf(o.wave, oscWaves) ||
      !inRange(o.coarse, -24, 24) ||
      !inRange(o.fine, -100, 100) ||
      !inRange(o.level, 0, 1)
    )
      return where + ' has an oscillator out of range.';
  const ranges: Record<string, [number, number]> = {
    attack_ms: [0, 5000],
    decay_ms: [0, 5000],
    sustain: [0, 1],
    release_ms: [0, 10000],
    cutoff_hz: [20, 20000],
    reso: [0.1, 20],
    glide_ms: [0, 2000]
  };
  for (const [key, [lo, hi]] of Object.entries(ranges))
    if (!inRange(s[key], lo, hi))
      return where + ' synth ' + key + ' must be ' + lo + ' to ' + hi + '.';
  if (typeof s.mono !== 'boolean') return where + ' synth mono must be true or false.';
  return null;
}

export function validateBeatProject(value: unknown): string | null {
  if (!isObject(value)) return 'Project must be a JSON object.';
  const p = value;
  if (p.schema !== beatSchema)
    return 'Unknown project schema version; this studio reads version 1.';
  if (!isBeatId(p.id)) return 'Project id is not valid.';
  if (!isName(p.name, 80)) return 'Project name must be 1–80 characters.';
  if (!inRange(p.bpm, 40, 240)) return 'BPM must be 40 to 240.';
  if (!inRange(p.swing, 0, 75)) return 'Swing must be 0 to 75.';
  if (p.ppq !== ppq) return 'Projects use ' + ppq + ' ticks per beat.';
  if (typeof p.created_at !== 'string' || typeof p.updated_at !== 'string')
    return 'Project timestamps are missing.';
  if (!inRange(p.master_db, -60, 6)) return 'Master volume must be -60 to 6 dB.';

  if (!Array.isArray(p.channels) || p.channels.length > beatLimits.channels)
    return 'A project has at most ' + beatLimits.channels + ' channels.';
  const channelIds = new Set<string>();
  for (const [i, raw] of (p.channels as unknown[]).entries()) {
    const where = 'Channel ' + (i + 1);
    if (!isObject(raw)) return where + ' is not valid.';
    if (!isPartId(raw.id) || channelIds.has(raw.id)) return where + ' id is missing or repeated.';
    channelIds.add(raw.id);
    if (!isName(raw.name, 40)) return where + ' name must be 1–40 characters.';
    if (typeof raw.colour !== 'string' || !/^#[0-9a-f]{6}$/i.test(raw.colour))
      return where + ' colour must be a #rrggbb value.';
    if (!isInt(raw.root_key, 0, 127)) return where + ' root key must be 0 to 127.';
    const bad = validateInstrument(raw.instrument, where);
    if (bad) return bad;
    const m = raw.mixer;
    if (
      !isObject(m) ||
      !inRange(m.volume_db, -60, 6) ||
      !inRange(m.pan, -1, 1) ||
      typeof m.mute !== 'boolean' ||
      typeof m.solo !== 'boolean'
    )
      return where + ' mixer settings are not valid.';
  }

  if (
    !Array.isArray(p.patterns) ||
    p.patterns.length < 1 ||
    p.patterns.length > beatLimits.patterns
  )
    return 'A project has 1 to ' + beatLimits.patterns + ' patterns.';
  const patternIds = new Set<string>();
  let notes = 0;
  for (const [i, raw] of (p.patterns as unknown[]).entries()) {
    const where = 'Pattern ' + (i + 1);
    if (!isObject(raw)) return where + ' is not valid.';
    if (!isPartId(raw.id) || patternIds.has(raw.id)) return where + ' id is missing or repeated.';
    patternIds.add(raw.id);
    if (!isName(raw.name, 40)) return where + ' name must be 1–40 characters.';
    if (!oneOf(raw.steps, patternStepOptions))
      return where + ' must be ' + patternStepOptions.join(', ') + ' steps.';
    const ticks = (raw.steps as number) * stepTicks;
    if (!isObject(raw.notes)) return where + ' notes are missing.';
    for (const [channel, list] of Object.entries(raw.notes)) {
      if (!channelIds.has(channel)) return where + ' has notes for an unknown channel.';
      if (!Array.isArray(list)) return where + ' notes are not a list.';
      notes += list.length;
      if (notes > beatLimits.notes)
        return 'A project has at most ' + beatLimits.notes.toLocaleString('en') + ' notes.';
      for (const n of list as unknown[])
        if (
          !isObject(n) ||
          !isInt(n.key, 0, 127) ||
          !isInt(n.start, 0, ticks - 1) ||
          !isInt(n.length, 1, ticks) ||
          !isInt(n.velocity, 1, 127)
        )
          return where + ' has a note out of range.';
    }
  }

  const pl = p.playlist;
  if (!isObject(pl) || !Array.isArray(pl.clips)) return 'The playlist is missing.';
  if (pl.clips.length > beatLimits.clips)
    return 'The playlist holds at most ' + beatLimits.clips + ' clips.';
  for (const c of pl.clips as unknown[])
    if (
      !isObject(c) ||
      typeof c.pattern_id !== 'string' ||
      !patternIds.has(c.pattern_id) ||
      !isInt(c.track, 0, beatLimits.tracks - 1) ||
      !isInt(c.start_beat, 0, beatLimits.maxStartBeat)
    )
      return 'A playlist clip is not valid.';
  return null;
}

/** A validated project with only the known fields, so stray data is never stored. */
export function cleanBeatProject(p: BeatProject): BeatProject {
  const instrument = (i: BeatInstrument): BeatInstrument =>
    i.kind === 'synth'
      ? {
          kind: 'synth',
          synth: {
            osc: i.synth.osc.map((o) => ({
              wave: o.wave,
              coarse: o.coarse,
              fine: o.fine,
              level: o.level
            })),
            attack_ms: i.synth.attack_ms,
            decay_ms: i.synth.decay_ms,
            sustain: i.synth.sustain,
            release_ms: i.synth.release_ms,
            cutoff_hz: i.synth.cutoff_hz,
            reso: i.synth.reso,
            mono: i.synth.mono,
            glide_ms: i.synth.glide_ms
          }
        }
      : i.kind === 'drum'
        ? { kind: 'drum', drum: i.drum, tune_st: i.tune_st, decay: i.decay }
        : { kind: 'sampler', sound_id: i.sound_id, mode: i.mode };
  return {
    schema: beatSchema,
    id: p.id,
    name: p.name,
    bpm: p.bpm,
    swing: p.swing,
    ppq,
    created_at: p.created_at,
    updated_at: p.updated_at,
    channels: p.channels.map((c) => ({
      id: c.id,
      name: c.name,
      colour: c.colour,
      root_key: c.root_key,
      instrument: instrument(c.instrument),
      mixer: {
        volume_db: c.mixer.volume_db,
        pan: c.mixer.pan,
        mute: c.mixer.mute,
        solo: c.mixer.solo
      }
    })),
    patterns: p.patterns.map((pat) => ({
      id: pat.id,
      name: pat.name,
      steps: pat.steps,
      notes: Object.fromEntries(
        Object.entries(pat.notes).map(([ch, list]) => [
          ch,
          list.map((n) => ({ key: n.key, start: n.start, length: n.length, velocity: n.velocity }))
        ])
      )
    })),
    playlist: {
      clips: p.playlist.clips.map((c) => ({
        pattern_id: c.pattern_id,
        track: c.track,
        start_beat: c.start_beat
      }))
    },
    master_db: p.master_db
  };
}
