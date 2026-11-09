import {
  patternTicks,
  ppq,
  songTicks,
  stepTicks,
  type BeatChannel,
  type BeatPattern,
  type BeatProject
} from '@vbm/contracts';

export type PlayMode = 'pattern' | 'song';

export interface NoteEvent {
  channel: string;
  key: number;
  velocity: number;
  /** Absolute ticks since play started, swing included (may be fractional). */
  tick: number;
  length: number;
}

/** Ticks a note starting at `start` is pushed late: the second 16th of each pair moves. */
export function swingOffset(start: number, swing: number): number {
  const pair = stepTicks * 2;
  const phase = ((start % pair) + pair) % pair;
  return phase >= stepTicks ? (swing / 100) * (stepTicks / 2) : 0;
}

/** Channels that sound: any solo leaves only the soloed ones; mute always wins. */
export function audibleChannels(channels: readonly BeatChannel[]): Set<string> {
  const soloed = channels.some((c) => c.mixer.solo);
  return new Set(
    channels.filter((c) => !c.mixer.mute && (!soloed || c.mixer.solo)).map((c) => c.id)
  );
}

/** Length of one pass: the pattern, or the song rounded up to a bar. 0 means nothing to play. */
export function loopTicks(project: BeatProject, mode: PlayMode, patternId: string): number {
  if (mode === 'song') return songTicks(project);
  const p = project.patterns.find((x) => x.id === patternId);
  return p ? patternTicks(p) : 0;
}

function pushPattern(
  out: NoteEvent[],
  pattern: BeatPattern,
  at: number,
  from: number,
  to: number,
  swing: number,
  audible: Set<string>
) {
  for (const [channel, notes] of Object.entries(pattern.notes)) {
    if (!audible.has(channel)) continue;
    for (const n of notes) {
      const tick = at + n.start;
      if (tick < from || tick >= to) continue;
      out.push({
        channel,
        key: n.key,
        velocity: n.velocity,
        tick: tick + swingOffset(n.start, swing),
        length: n.length
      });
    }
  }
}

/** Notes starting in [from, to) absolute ticks, looping the pattern or song when asked. */
export function windowEvents(
  project: BeatProject,
  mode: PlayMode,
  patternId: string,
  from: number,
  to: number,
  loop = true
): NoteEvent[] {
  const out: NoteEvent[] = [];
  const length = loopTicks(project, mode, patternId);
  if (length <= 0 || to <= from) return out;
  const audible = audibleChannels(project.channels);
  const first = loop ? Math.floor(from / length) : 0;
  const last = loop ? Math.floor((to - 1) / length) : 0;
  const byId = new Map(project.patterns.map((p) => [p.id, p]));
  for (let pass = Math.max(0, first); pass <= last; pass++) {
    const base = pass * length;
    if (mode === 'pattern') {
      const p = byId.get(patternId);
      if (p) pushPattern(out, p, base, from, Math.min(to, base + length), project.swing, audible);
      continue;
    }
    for (const clip of project.playlist.clips) {
      const p = byId.get(clip.pattern_id);
      if (!p) continue;
      const start = base + clip.start_beat * ppq;
      if (start >= to || start + patternTicks(p) <= from) continue;
      pushPattern(out, p, start, from, Math.min(to, base + length), project.swing, audible);
    }
  }
  return out.sort((a, b) => a.tick - b.tick || a.channel.localeCompare(b.channel));
}
