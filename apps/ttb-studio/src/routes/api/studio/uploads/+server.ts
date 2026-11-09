import type { RequestHandler } from './$types';
import { noStore, studioContext, studioError } from '../../../../lib/server/studio/context';
import {
  importSong,
  readForm,
  uploadGuard,
  uploadInputFromForm
} from '../../../../lib/server/studio/uploads';

/** Multipart upload of a song, beat, acapella, recording, video, stems or rendered MIDI. */
export const POST: RequestHandler = async ({ request, fetch }) => {
  const blocked = uploadGuard(request);
  if (blocked) return blocked;
  try {
    const ctx = studioContext(fetch);
    const now = ctx.now();
    const input = await uploadInputFromForm(await readForm(request), now);
    const song = await importSong(ctx.library, input, now);
    return Response.json({ song }, { status: 201, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
