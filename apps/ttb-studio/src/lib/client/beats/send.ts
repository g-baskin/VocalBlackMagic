import type { SongMeta } from '@vbm/contracts';

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
