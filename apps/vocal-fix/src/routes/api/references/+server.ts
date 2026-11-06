import type { RequestHandler } from './$types';
import { passthrough, upstreamUnavailable, upstreamUrl } from '../../../lib/server/backend';
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const EXTENSIONS = /\.(wav|mp3|flac|m4a)$/i;
export const POST: RequestHandler = async ({ request, fetch }) => {
  // Fail closed: this prototype has no user sessions or tenant isolation.
  if (process.env.NODE_ENV !== 'development')
    return Response.json(
      {
        detail: 'Upload is disabled until SaaS authentication and tenant security are implemented.'
      },
      { status: 403 }
    );
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ detail: 'Invalid multipart form.' }, { status: 400 });
  }
  const items = form.getAll('files');
  const files = items.filter((f): f is File => f instanceof File);
  if (items.length !== 5 || files.length !== 5)
    return Response.json({ detail: 'Exactly five recordings are required.' }, { status: 422 });
  if (form.get('acknowledged_rights') !== 'true')
    return Response.json(
      { detail: 'Speaker authorization and recording rights are required.' },
      { status: 403 }
    );
  if (!String(form.get('voice_owner') || '').trim())
    return Response.json({ detail: 'Enter the authorized performer name.' }, { status: 422 });
  if (
    files.some((file) => file.size < 1 || file.size > MAX_FILE_SIZE || !EXTENSIONS.test(file.name))
  )
    return Response.json(
      { detail: 'Each recording must be WAV, MP3, FLAC, or M4A and 1 byte to 25 MiB.' },
      { status: 422 }
    );
  try {
    const response = await fetch(
      upstreamUrl('VOCAL_FIX_API_URL', 'http://127.0.0.1:8001', '/api/references'),
      {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60_000)
      }
    );
    return passthrough(response);
  } catch (error) {
    return upstreamUnavailable(error);
  }
};
