import { padCount, type Kit, type LaunchGrid, type SoundCategory } from '@vbm/contracts';

/** Small seeded PRNG (mulberry32) so an Inspire result can be reproduced from its seed. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const grids: LaunchGrid[] = ['natural', '1/4', '1/2', '1 bar', '1 bar', '2 bars'];
const beds: SoundCategory[] = ['ambience', 'pad'];

/**
 * A new arrangement of the library onto the kit: each row of six pads gets one category,
 * an occasional ambience/pad second layer, a launch grid, and fresh macro settings.
 */
export function inspire(
  kit: Kit,
  sounds: readonly { id: string; category: SoundCategory }[],
  seed: number
): Kit {
  const rand = seeded(seed);
  const out = structuredClone(kit);
  out.macros = out.macros.map(() => Math.round(rand() * 60) / 100);
  if (!sounds.length) return out;
  const byCategory = new Map<SoundCategory, string[]>();
  for (const s of sounds) byCategory.set(s.category, [...(byCategory.get(s.category) ?? []), s.id]);
  const categories = shuffle([...byCategory.keys()], rand);
  const bedSounds = sounds.filter((s) => beds.includes(s.category)).map((s) => s.id);
  const rows = padCount / 6;
  for (let row = 0; row < rows; row++) {
    const pool = shuffle(byCategory.get(categories[row % categories.length]) ?? [], rand);
    const grid = grids[Math.floor(rand() * grids.length)];
    for (let col = 0; col < 6; col++) {
      const pad = out.pads[row * 6 + col];
      const second =
        bedSounds.length && rand() < 0.25 ? bedSounds[Math.floor(rand() * bedSounds.length)] : null;
      pad.layers = [
        pool[col % pool.length],
        second !== pool[col % pool.length] ? second : null,
        null
      ];
      pad.launch = { ...pad.launch, lands_on: grid, sync: grid !== 'natural', reverse: false };
    }
  }
  return out;
}
