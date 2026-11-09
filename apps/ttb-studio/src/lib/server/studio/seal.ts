import type { SongMeta } from '@vbm/contracts';
import { loadSeance, type StoredSeance } from './seance';

export const sealedLabel = 'Compare take (hidden)';
/** Params that name the model, its runner or its price. */
const revealingParams = ['runner', 'model_version', 'model', 'engine', 'est_cost_usd'];

/**
 * Hides everything that identifies a séance take's model until that séance is revealed: engine,
 * runner record, model params, the per-model price, and lyrics a model rewrote itself (Lyria 3 Pro
 * returns its own), which are replaced by the séance's shared lyrics. The audio format and length
 * are left alone: they are the take itself and are what the user is comparing.
 */
export function sealSong(song: SongMeta, seance: StoredSeance | null = null): SongMeta {
  const params = Object.fromEntries(
    Object.entries(song.params).filter(([key]) => !revealingParams.includes(key))
  );
  const { runner: _runner, ...rest } = song;
  void _runner;
  return {
    ...rest,
    engine: sealedLabel,
    params,
    est_cost_usd: 0,
    lyrics: seance ? seance.lyrics : null
  };
}

/** Seals every take whose séance is unrevealed (or unreadable: fail closed). */
export async function sealSongs(root: string, songs: SongMeta[]): Promise<SongMeta[]> {
  const seances = new Map<string, StoredSeance | null>();
  const out: SongMeta[] = [];
  for (const song of songs) {
    const id = song.seance_id;
    if (!id) {
      out.push(song);
      continue;
    }
    if (!seances.has(id)) seances.set(id, await loadSeance({ root }, id).catch(() => null));
    const seance = seances.get(id) ?? null;
    out.push(seance?.revealed ? song : sealSong(song, seance));
  }
  return out;
}
