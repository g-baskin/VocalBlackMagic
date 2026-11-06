import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { VoiceModel } from '@vbm/contracts';
import { ProviderError } from '../music/errors';

const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const goldFilePattern = /^gold\.[a-z0-9.-]+\.wav$/;

/** Newest Gold Vocal WAV of the voice's consent session, resolved strictly inside the data dir. */
export async function goldVocalFile(root: string, voice: VoiceModel): Promise<string> {
  const session = voice.consent.session_id;
  if (!sessionIdPattern.test(session))
    throw new ProviderError(422, 'The voice has an invalid consent session.');
  const derived = path.join(root, 'vocal-fix', 'sessions', session, 'derived');
  let chosen = 'gold.gold.v1.wav';
  try {
    const manifest = JSON.parse(
      await readFile(path.join(root, 'vocal-fix', 'sessions', session, 'manifest.json'), 'utf8')
    ) as { versions?: { kind?: unknown; file?: unknown; created_at?: unknown }[] };
    const golds = (manifest.versions ?? [])
      .filter(
        (v): v is { kind: string; file: string; created_at: string } =>
          v.kind === 'gold' &&
          typeof v.file === 'string' &&
          goldFilePattern.test(v.file) &&
          typeof v.created_at === 'string'
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (golds[0]) chosen = golds[0].file;
  } catch {
    // No readable manifest: fall back to the first Gold Vocal version.
  }
  const file = path.resolve(derived, chosen);
  if (!file.startsWith(path.resolve(root) + path.sep) || path.dirname(file) !== derived)
    throw new ProviderError(422, 'The Gold Vocal path is not valid.');
  const info = await stat(file).catch(() => null);
  if (!info?.isFile())
    throw new ProviderError(404, 'This voice has no Gold Vocal yet. Build one in Vocal Fix first.');
  return file;
}
