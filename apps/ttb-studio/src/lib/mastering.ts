/** Whole-mix choices. Selecting one does not process audio. */
export const masteringPresets = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Gentle EQ and glue compression. The original Studio Master.'
  },
  { id: 'warm', name: 'Warm', description: 'A small low-mid lift with softer highs.' },
  { id: 'punchy', name: 'Punchy', description: 'A small bass lift with tighter compression.' },
  { id: 'airy', name: 'Airy', description: 'A brighter high shelf with lighter compression.' },
  {
    id: 'deep-bass',
    name: 'Deep Bass',
    description: 'A deeper bass lift with a small low-mid cut.'
  },
  {
    id: 'smooth',
    name: 'Smooth',
    description: 'Softer upper mids and highs with gentle compression.'
  },
  {
    id: 'presence',
    name: 'Presence',
    description: 'A small upper-mid lift for definition across the whole mix.'
  },
  {
    id: 'dynamic',
    name: 'Dynamic',
    description: 'Low-cut cleanup and loudness normalization, without an added compressor.'
  }
] as const;
export type MasteringPreset = (typeof masteringPresets)[number]['id'];
export function isMasteringPreset(value: unknown): value is MasteringPreset {
  return masteringPresets.some((preset) => preset.id === value);
}
