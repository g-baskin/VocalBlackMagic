import { soundCategories, type SoundCategory } from '@vbm/contracts';
import type { RequestHandler } from './$types';
import { guard, noStore, studioError } from '../../../../lib/server/studio/context';
import { samplerContext } from '../../../../lib/server/sampler/context';

export const GET: RequestHandler = async ({ request, url }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  const category = url.searchParams.get('category');
  if (category && !(soundCategories as readonly string[]).includes(category))
    return Response.json({ detail: 'Unknown category.' }, { status: 422 });
  try {
    const sounds = await samplerContext().sounds.list({
      q: url.searchParams.get('q')?.slice(0, 100) ?? undefined,
      category: (category as SoundCategory) || undefined,
      favourite: url.searchParams.get('favourite') === '1'
    });
    return Response.json({ sounds }, { headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
