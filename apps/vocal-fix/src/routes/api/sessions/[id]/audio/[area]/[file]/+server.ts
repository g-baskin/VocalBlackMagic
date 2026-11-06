import type { RequestHandler } from './$types';
import { errorResponse, VocalFixError } from '../../../../../../../lib/server/errors';
import { fileResponse } from '../../../../../../../lib/server/range';
import { disabledResponse } from '../../../../../../../lib/server/gate';
import { svc } from '../../../../../../../lib/server/svc';

const TYPES: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  aac: 'audio/aac',
  json: 'application/json',
  webm: 'audio/webm',
  zip: 'application/zip'
};

export const GET: RequestHandler = async ({ params, request }) => {
  const blocked = disabledResponse();
  if (blocked) return blocked;
  try {
    if (params.area !== 'originals' && params.area !== 'derived')
      throw new VocalFixError('Unknown file.', 404);
    const s = svc();
    await s.store.read(params.id);
    const file = Bun.file(s.store.filePath(params.id, params.area, params.file));
    if (!(await file.exists())) throw new VocalFixError('Unknown file.', 404);
    const ext = params.file.split('.').at(-1) ?? '';
    return fileResponse(
      file.name ?? '',
      file.size,
      TYPES[ext] ?? 'application/octet-stream',
      request.headers.get('range')
    );
  } catch (error) {
    return errorResponse(error);
  }
};
