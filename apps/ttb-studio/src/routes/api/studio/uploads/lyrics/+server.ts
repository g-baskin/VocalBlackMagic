import type { RequestHandler } from './$types';
import {
  guard,
  noStore,
  readJson,
  studioContext,
  studioError
} from '../../../../../lib/server/studio/context';
import {
  checkLyricsText,
  extractLyrics,
  formFiles,
  LyricSheets,
  parseTitle,
  readForm,
  rightsFrom,
  uploadGuard
} from '../../../../../lib/server/studio/uploads';

export const GET: RequestHandler = async ({ request, fetch }) => {
  const blocked = guard(request, false);
  if (blocked) return blocked;
  const sheets = new LyricSheets(studioContext(fetch).library.root);
  return Response.json({ sheets: await sheets.list() }, { headers: noStore });
};

/** A lyric file (multipart: file, title, rights) or pasted text (JSON: text, title, rights). */
export const POST: RequestHandler = async ({ request, fetch }) => {
  const blocked = uploadGuard(request);
  if (blocked) return blocked;
  try {
    const ctx = studioContext(fetch);
    const now = ctx.now();
    let fields: { title: unknown; rights: unknown };
    let extracted: { text: string; source: string };
    if ((request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
      const body = (await readJson(request)) as Record<string, unknown> | undefined;
      if (!body || typeof body !== 'object')
        return Response.json({ detail: 'Invalid lyrics.' }, { status: 422 });
      fields = { title: body.title, rights: body.rights };
      rightsFrom(fields.rights, now);
      if (typeof body.text !== 'string')
        return Response.json({ detail: 'Paste some lyrics.' }, { status: 422 });
      extracted = { text: checkLyricsText(body.text), source: 'paste' };
    } else {
      const form = await readForm(request);
      fields = { title: form.get('title'), rights: form.get('rights') };
      rightsFrom(fields.rights, now);
      const [file] = await formFiles(form, 'file');
      if (!file) return Response.json({ detail: 'Choose a lyrics file.' }, { status: 422 });
      extracted = await extractLyrics(file.name, file.bytes);
    }
    const sheet = await new LyricSheets(ctx.library.root).add({
      title: parseTitle(fields.title),
      text: extracted.text,
      source: extracted.source,
      created_at: now.toISOString(),
      rights: rightsFrom(fields.rights, now)
    });
    return Response.json({ sheet }, { status: 201, headers: noStore });
  } catch (error) {
    return studioError(error);
  }
};
