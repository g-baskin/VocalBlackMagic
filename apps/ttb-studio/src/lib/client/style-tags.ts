/**
 * Style tag catalogue for the Create page picker.
 *
 * Curated from YuE's `top_200_tags.json` (genre, instrument, mood, gender and timbre tags;
 * Apache License 2.0, https://github.com/multimodal-art-projection/YuE/tree/YuE-v1), with
 * duplicates merged, non-musical and unclear entries removed, and current genres the list lacks
 * added. See THIRD_PARTY_NOTICES.md. Tags stay free text: typing your own still works.
 */

/** Same limits as validateCreateSongRequest in @vbm/contracts. */
export const MAX_STYLE_TAGS = 20;
export const MAX_STYLE_TAG_LENGTH = 40;

export type StyleCategory = { id: string; label: string; tags: readonly string[] };

export const styleCategories: readonly StyleCategory[] = [
  {
    id: 'genre',
    label: 'Genre',
    tags: [
      'pop',
      'dance pop',
      'indie pop',
      'synthpop',
      'electropop',
      'k-pop',
      'latin pop',
      'hyperpop',
      'rock',
      'pop rock',
      'indie rock',
      'alternative rock',
      'classic rock',
      'hard rock',
      'punk',
      'pop punk',
      'emo',
      'grunge',
      'shoegaze',
      'post-rock',
      'progressive rock',
      'glam rock',
      'metal',
      'heavy metal',
      'metalcore',
      'hip-hop',
      'rap',
      'trap',
      'boom bap',
      'drill',
      'grime',
      'phonk',
      'r&b',
      'neo soul',
      'soul',
      'funk',
      'disco',
      'gospel',
      'blues',
      'jazz',
      'smooth jazz',
      'lo-fi hip-hop',
      'electronic',
      'house',
      'deep house',
      'techno',
      'trance',
      'dubstep',
      'drum and bass',
      'synthwave',
      'ambient',
      'downtempo',
      'chillout',
      'edm',
      'eurodance',
      'afrobeats',
      'amapiano',
      'reggae',
      'dancehall',
      'reggaeton',
      'salsa',
      'bossa nova',
      'samba',
      'regional mexican',
      'country',
      'country rock',
      'americana',
      'bluegrass',
      'folk',
      'indie folk',
      'singer-songwriter',
      'celtic',
      'classical',
      'orchestral',
      'cinematic',
      'soundtrack',
      'opera',
      'choral',
      'big band',
      'lounge',
      'new age',
      'world',
      'middle eastern',
      'indian',
      'african',
      'chanson',
      'j-rock',
      'ska',
      'rockabilly',
      '8-bit',
      'experimental'
    ]
  },
  {
    id: 'mood',
    label: 'Mood',
    tags: [
      'uplifting',
      'happy',
      'joyful',
      'cheerful',
      'energetic',
      'upbeat',
      'playful',
      'groovy',
      'danceable',
      'confident',
      'empowering',
      'motivational',
      'inspiring',
      'hopeful',
      'optimistic',
      'celebratory',
      'festive',
      'romantic',
      'sensual',
      'intimate',
      'heartfelt',
      'emotional',
      'sentimental',
      'nostalgic',
      'longing',
      'melancholic',
      'sad',
      'bittersweet',
      'reflective',
      'introspective',
      'dreamy',
      'atmospheric',
      'calm',
      'relaxing',
      'peaceful',
      'chill',
      'soothing',
      'gentle',
      'spiritual',
      'epic',
      'dramatic',
      'powerful',
      'intense',
      'dark',
      'mysterious',
      'aggressive',
      'angry',
      'rebellious',
      'futuristic',
      'summer',
      'christmas',
      'funny'
    ]
  },
  {
    id: 'instruments',
    label: 'Instruments',
    tags: [
      'piano',
      'electric piano',
      'organ',
      'synthesizer',
      'synth bass',
      'synth pads',
      'acoustic guitar',
      'electric guitar',
      'nylon string guitar',
      'bass guitar',
      'funky bass',
      '808 bass',
      'drums',
      'acoustic drums',
      'drum machine',
      'percussion',
      'hand claps',
      'congas',
      'bongos',
      'tabla',
      'strings',
      'violin',
      'cello',
      'harp',
      'brass',
      'horns',
      'trumpet',
      'trombone',
      'saxophone',
      'flute',
      'clarinet',
      'harmonica',
      'accordion',
      'ukulele',
      'banjo',
      'mandolin',
      'pedal steel guitar',
      'sitar',
      'oud',
      'erhu',
      'koto',
      'marimba',
      'steel pan',
      'glockenspiel',
      'choir',
      'turntables',
      'vocal chops',
      'whistle'
    ]
  },
  {
    id: 'voice',
    label: 'Voice',
    tags: [
      'female vocal',
      'male vocal',
      'duet',
      'choir vocals',
      'child vocal',
      'rapping',
      'spoken word',
      'soprano',
      'mezzo-soprano',
      'alto',
      'tenor',
      'baritone',
      'bass vocal',
      'harmonies',
      'falsetto',
      'vocal runs',
      'ad-libs'
    ]
  },
  {
    id: 'tone',
    label: 'Vocal tone',
    tags: [
      'bright vocal',
      'clear vocal',
      'airy vocal',
      'breathy vocal',
      'whispery vocal',
      'soft vocal',
      'sweet vocal',
      'tender vocal',
      'warm vocal',
      'smooth vocal',
      'velvety vocal',
      'mellow vocal',
      'rich vocal',
      'full vocal',
      'deep vocal',
      'dark vocal',
      'soulful vocal',
      'powerful vocal',
      'strong vocal',
      'raspy vocal',
      'husky vocal',
      'gritty vocal',
      'gravelly vocal',
      'raw vocal',
      'sultry vocal',
      'youthful vocal',
      'nasal vocal',
      'high-pitched vocal',
      'low vocal',
      'reverb vocal',
      'emotional vocal',
      'aggressive vocal'
    ]
  },
  {
    id: 'tempo',
    label: 'Tempo & era',
    tags: [
      'slow tempo',
      'mid-tempo',
      'fast tempo',
      '70 bpm',
      '90 bpm',
      '100 bpm',
      '120 bpm',
      '128 bpm',
      '140 bpm',
      '170 bpm',
      'half-time',
      'four on the floor',
      'swing',
      '60s',
      '70s',
      '80s',
      '90s',
      '2000s',
      'retro',
      'vintage',
      'modern',
      'lo-fi',
      'polished production',
      'live recording',
      'acoustic',
      'minimal',
      'anthemic',
      'ballad'
    ]
  }
];

const key = (tag: string) => tag.trim().toLowerCase();

/** Comma-separated text to unique, trimmed tags (first spelling wins), capped like the contract. */
export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(',')) {
    const tag = raw.trim();
    if (!tag || seen.has(key(tag))) continue;
    seen.add(key(tag));
    out.push(tag);
  }
  return out.slice(0, MAX_STYLE_TAGS);
}

export function hasTag(text: string, tag: string): boolean {
  return parseTags(text).some((t) => key(t) === key(tag));
}

/** Adds or removes one tag. Adding is a no-op at the tag limit. Returns the new text. */
export function toggleTag(text: string, tag: string): string {
  const tags = parseTags(text);
  const index = tags.findIndex((t) => key(t) === key(tag));
  if (index >= 0) tags.splice(index, 1);
  else if (tags.length < MAX_STYLE_TAGS && tag.trim()) tags.push(tag.trim());
  return tags.join(', ');
}

/** Catalogue tags containing the query, grouped by category; empty query returns nothing. */
export function searchTags(query: string): { category: StyleCategory; tags: string[] }[] {
  const q = key(query);
  if (!q) return [];
  return styleCategories
    .map((category) => ({ category, tags: category.tags.filter((t) => t.includes(q)) }))
    .filter((group) => group.tags.length > 0);
}
