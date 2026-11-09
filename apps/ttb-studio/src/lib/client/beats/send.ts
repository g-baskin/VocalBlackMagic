import { beatLimits, type BeatProject, type SongMeta } from '@vbm/contracts';

/** The hand-off key the Create page reads once on load (shared with the lyrics page). */
export const createPrefillKey = 'vbm-studio-prefill';

export interface CreatePrefill {
  title?: string;
  prompt?: string;
  /** Library song to preselect as the music reference. */
  reference?: string;
}

/** Library title for a rendered beat: the project name, cut to the upload limit. */
export function beatTitle(project: string, what: string): string {
  return (project.trim() || 'Untitled beat').slice(0, 100) + (what ? ' (' + what + ')' : '');
}

/** Adds a rendered beat to the song library as an upload of type "beat". */
export async function uploadBeat(wav: Blob, title: string): Promise<SongMeta> {
  const form = new FormData();
  form.set('type', 'beat');
  form.set('title', title.slice(0, 120));
  form.set('genre', '');
  form.set('tags', '');
  // The caller asks the user to confirm this statement first.
  form.set('rights', 'true');
  form.append('file', new File([wav], 'beat.wav', { type: 'audio/wav' }));
  const response = await fetch('/api/studio/uploads', {
    method: 'POST',
    headers: { 'x-vbm-intent': 'upload', accept: 'application/json' },
    body: form
  });
  const reply = (await response.json().catch(() => ({}))) as { song?: SongMeta; detail?: string };
  if (!response.ok || !reply.song)
    throw new Error(
      reply.detail || 'Adding the beat to the library failed (' + response.status + ').'
    );
  return reply.song;
}

/** Seconds a beat sent to Create should last at least; one bar is too short for song models. */
export const minSendSeconds = 30;

/**
 * A copy of the project whose playlist repeats one pattern from bar 1 until it lasts at least
 * `minSeconds`, so a single pattern can be rendered in Song mode as a usable beat.
 */
export function loopedForSend(
  project: BeatProject,
  patternId: string,
  minSeconds = minSendSeconds
): { project: BeatProject; repeats: number } {
  const pattern = project.patterns.find((p) => p.id === patternId);
  if (!pattern) throw new Error('Pick a pattern first.');
  const beats = pattern.steps / 4;
  const passSeconds = (beats * 60) / project.bpm;
  const fit = Math.min(
    beatLimits.clips,
    Math.floor(beatLimits.maxStartBeat / beats) + 1,
    Math.max(1, Math.ceil(minSeconds / passSeconds))
  );
  const clips = Array.from({ length: fit }, (_, i) => ({
    pattern_id: pattern.id,
    track: 0,
    start_beat: i * beats
  }));
  return { project: { ...project, playlist: { clips } }, repeats: fit };
}
