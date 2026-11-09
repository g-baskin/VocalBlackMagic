import { createHash } from 'node:crypto';
import {
  maxUploadBytes,
  soundCategories,
  type SoundCategory,
  type SoundMeta
} from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import type { SoundLibrary } from './sounds';

export const rightsHeader = 'x-vbm-rights';
export const rightsStatement = 'own-or-licensed';

/** Reads the raw body, refusing more than maxBytes (declared length first, then actual). */
export async function readBody(request: Request, maxBytes = maxUploadBytes): Promise<Uint8Array> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await request.body?.cancel();
    throw new ProviderError(413, 'Uploads can be at most 20 MB.');
  }
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ProviderError(413, 'Uploads can be at most 20 MB.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export interface UploadFields {
  name: string;
  category: SoundCategory;
  attested_name: string;
  original_name: string;
}

/** Name, category and the typed rights attestation come from the query and one header. */
export function uploadFields(request: Request, url: URL): UploadFields | string {
  if (request.headers.get(rightsHeader) !== rightsStatement)
    return 'Confirm you made this audio or have the rights to use it.';
  const attested = (url.searchParams.get('attested_name') ?? '').trim();
  if (attested.length < 2 || attested.length > 80)
    return 'Type your full name to confirm your rights.';
  const name = (url.searchParams.get('name') ?? '').trim();
  if (!name || name.length > 80) return 'Name must be 1–80 characters.';
  const category = url.searchParams.get('category') ?? '';
  if (!(soundCategories as readonly string[]).includes(category)) return 'Unknown category.';
  const original = (url.searchParams.get('original_name') ?? '').trim().slice(0, 200);
  return {
    name,
    category: category as SoundCategory,
    attested_name: attested,
    original_name: original
  };
}

export async function storeUpload(
  sounds: SoundLibrary,
  fields: UploadFields,
  bytes: Uint8Array,
  now: Date = new Date()
): Promise<SoundMeta> {
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  return sounds.add({
    bytes,
    name: fields.name,
    category: fields.category,
    source: {
      kind: 'upload',
      sha256,
      original_name: fields.original_name,
      attested_name: fields.attested_name,
      attested_at: now.toISOString()
    }
  });
}
