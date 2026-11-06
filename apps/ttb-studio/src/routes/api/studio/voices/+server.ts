import type { RequestHandler } from './$types';
import { guard, noStore, studioContext } from '../../../../lib/server/studio/context';
import { usableVoices } from '../../../../lib/server/studio/voices';

export const GET: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  const voices = await usableVoices(studioContext(fetch).library.root);
  // Only what the picker needs; model URLs and consent statements stay server-side.
  return Response.json(
    {
      voices: voices.map((v) => ({
        id: v.id,
        performer: v.performer,
        created_at: v.created_at,
        profile: v.profile ?? {}
      }))
    },
    { headers: noStore }
  );
};
