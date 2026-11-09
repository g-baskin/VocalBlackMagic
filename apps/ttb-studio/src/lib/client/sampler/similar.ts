import type { SoundFeatures, SoundMeta } from '@vbm/contracts';

/** Distance in feature space: brightness (octaves), noisiness, loudness and punch. */
export function featureDistance(a: SoundFeatures, b: SoundFeatures): number {
  const bright = Math.abs(Math.log2(Math.max(20, a.centroid_hz) / Math.max(20, b.centroid_hz))) / 3;
  return (
    bright +
    Math.abs(a.flatness - b.flatness) * 3 +
    Math.abs(a.rms_db - b.rms_db) / 12 +
    Math.abs(a.crest_db - b.crest_db) / 12
  );
}

/** Library sounds closest to the target, nearest first (the target itself excluded). */
export function moreLike(target: SoundMeta, all: readonly SoundMeta[], limit = 24): SoundMeta[] {
  return all
    .filter((s) => s.id !== target.id)
    .map((s) => ({ s, d: featureDistance(target.features, s.features) }))
    .sort((x, y) => x.d - y.d || x.s.name.localeCompare(y.s.name))
    .slice(0, limit)
    .map((x) => x.s);
}
