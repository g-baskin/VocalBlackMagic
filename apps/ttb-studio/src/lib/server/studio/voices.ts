import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { isVoiceModel, voiceIdPattern, type VoiceModel } from '@vbm/contracts';

/** A voice is usable only when trained, owned by the speaker and backed by a model file. */
export function isUsableVoice(voice: VoiceModel): voice is VoiceModel {
  return (
    voice.status === 'ready' &&
    voice.consent.own_voice === true &&
    ((typeof voice.model_url === 'string' && voice.model_url.startsWith('https://')) ||
      typeof voice.model_file === 'string')
  );
}

export async function readVoices(root: string): Promise<VoiceModel[]> {
  const dir = path.join(root, 'shared', 'voices');
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const voices: VoiceModel[] = [];
  for (const name of names.sort()) {
    if (!name.endsWith('.json')) continue;
    const id = name.slice(0, -5);
    if (!voiceIdPattern.test(id)) continue;
    try {
      const parsed: unknown = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
      if (isVoiceModel(parsed) && parsed.id === id) voices.push(parsed);
    } catch {
      // Unreadable registry entries are ignored rather than trusted.
    }
  }
  return voices;
}

export async function usableVoices(root: string): Promise<VoiceModel[]> {
  return (await readVoices(root)).filter(isUsableVoice);
}
