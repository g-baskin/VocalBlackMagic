import type { RequestHandler } from './$types';
import { studioImportResponse } from '../../../../lib/server/studio-import';

export const GET: RequestHandler = ({ request, params }) =>
  studioImportResponse(request, params.id);
