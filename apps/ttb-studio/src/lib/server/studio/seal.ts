import type { SongMeta } from '@vbm/contracts';
import { loadSeance } from './seance';

export const sealedLabel = 'Séance take (sealed)';
const revealingParams = ['runner', 'model_version', 'model', 'engine'];

/** Hides everything that names a séance take's model or runner until that séance is revealed. */
export function sealSong(song: SongMeta): SongMeta {
  const params = Object.fromEntries(
    Object.entries(song.params).filter(([key]) => !revealingParams.includes(key))
  );
  const { runner: _runner, ...rest } = song;
  void _runner;
  return { ...rest, engine: sealedLabel, params };
}

/** Seals every take whose séance is unrevealed (or unreadable: fail closed). */
export async function sealSongs(root: string, songs: SongMeta[]): Promise<SongMeta[]> {
  const revealed = new Map<string, boolean>();
  const out: SongMeta[] = [];
  for (const song of songs) {
    const id = song.seance_id;
    if (!id) {
      out.push(song);
      continue;
    }
    if (!revealed.has(id))
      revealed.set(
        id,
        await loadSeance({ root }, id).then(
          (s) => s.revealed,
          () => false
        )
      );
    out.push(revealed.get(id) ? song : sealSong(song));
  }
  return out;
}
