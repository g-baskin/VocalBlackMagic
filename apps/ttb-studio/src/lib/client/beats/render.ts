import type { BeatProject } from '@vbm/contracts';
import { encodeWav } from '../jobs';
import { Voicer } from './instruments';
import { BeatMixer } from './mixer';
import { loopTicks, windowEvents, type PlayMode } from './schedule';
import { secondsPerTick } from './transport';

const sampleRate = 44100;
export const maxRenderSeconds = 600;

/** Renders one pass of the pattern or song to WAV through the same voices and mixer as live play. */
export async function renderBeat(
  project: BeatProject,
  mode: PlayMode,
  patternId: string,
  buffers: ReadonlyMap<string, AudioBuffer>
): Promise<Blob> {
  const ticks = loopTicks(project, mode, patternId);
  if (ticks <= 0)
    throw new Error(
      mode === 'song' ? 'The playlist is empty. Place a pattern first.' : 'Pick a pattern.'
    );
  const spt = secondsPerTick(project.bpm);
  const seconds = ticks * spt;
  if (seconds > maxRenderSeconds)
    throw new Error('Exports are limited to ' + maxRenderSeconds / 60 + ' minutes.');
  const events = windowEvents(project, mode, patternId, 0, ticks, false);
  if (!events.length) throw new Error('Nothing to export: no channel plays a note.');
  const tail = Math.min(10, tailSeconds(project));
  const length = Math.ceil(Math.min(maxRenderSeconds + 10, seconds + tail) * sampleRate);
  const ctx = new OfflineAudioContext(2, length, sampleRate);
  const mixer = new BeatMixer(ctx, project, false);
  const voicer = new Voicer(ctx, mixer, buffers);
  for (const e of events) {
    const channel = project.channels.find((c) => c.id === e.channel);
    if (channel) voicer.note(channel, e.key, e.velocity, e.tick * spt, e.length * spt);
  }
  return encodeWav(await ctx.startRendering());
}

/** Seconds the longest release or sample can ring past the last note. */
export function tailSeconds(project: BeatProject): number {
  let tail = 0.6;
  for (const c of project.channels) {
    const i = c.instrument;
    if (i.kind === 'synth') tail = Math.max(tail, (i.synth.release_ms / 1000) * 1.6 + 0.1);
    if (i.kind === 'drum') tail = Math.max(tail, 0.6 * i.decay);
    // Samples can be long; give one-shots up to 4 seconds.
    if (i.kind === 'sampler') tail = Math.max(tail, 4);
  }
  return tail;
}

export function saveFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.replace(/[^\w .-]/g, '_');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
