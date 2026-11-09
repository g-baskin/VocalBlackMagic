/**
 * Full prompts as people write them for song models: a style/production block, an optional
 * separator line (====), a "Lyrics" heading and section-tagged lyrics ([Verse 1], [Chorus],
 * [Outro, playout, ear candy]). Splits them into the Create form's fields and checks lengths.
 */
import { soundCharacterNames, type SoundCharacter } from '@vbm/contracts';
import { MAX_STYLE_TAGS, MAX_STYLE_TAG_LENGTH, styleCategories } from './style-tags';

/** Same limits as validateCreateSongRequest in @vbm/contracts. */
export const MAX_STYLE_CHARS = 3000;
export const MAX_LYRICS_CHARS = 15000;

export type SplitPrompt = { style: string; lyrics: string; title: string | null };

const SECTION_WORDS =
  'intro|verse|pre-?chorus|chorus|post-?chorus|hook|refrain|bridge|break|breakdown|build|build-?up|drop|interlude|instrumental|solo|outro|coda|tag|ending|end|spoken|rap|ad-?libs?|vamp|chant|skit';
const SECTION_TAG = new RegExp(
  `^\\s*\\[\\s*(?:(?:final|last|double|half|short|extended|repeat|full|first|second|third)\\s+)*(?:${SECTION_WORDS})\\b[^\\]\\n]{0,120}\\]\\s*$`,
  'i'
);
const LYRICS_HEADING = /^\s*(?:song\s+)?lyrics?\s*:?\s*$/i;
const SEPARATOR = /^\s*[=\-_*~#]{3,}\s*$/;
const TITLE_LINE = /^\s*(?:song\s+)?title\s*[:\-–]\s*(.{1,120}?)\s*$/i;
// "Voc+Production Prompt", "Style:", "Style of music", "Prompt", "Sound / genre"
const STYLE_HEADING =
  /^\s*[\w+&/ -]{0,30}\b(?:prompt|style|styles|production|vocals?|voc|sound|genre|description|vibe)\b[\w+&/ -]{0,30}:?\s*$/i;

export const isSectionTag = (line: string): boolean => SECTION_TAG.test(line);

const tidy = (text: string) =>
  text
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Splits a pasted full prompt. Returns null unless it holds lyrics (a "Lyrics" heading or a
 * section tag line) after some text, or starts with lyrics but has a separator-led style block.
 */
export function splitFullPrompt(text: string): SplitPrompt | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let title: string | null = null;
  const kept: string[] = [];
  for (const line of lines) {
    const m = TITLE_LINE.exec(line);
    if (m && title === null) title = m[1].replace(/^["“']|["”']$/g, '').trim() || null;
    else kept.push(line);
  }

  let start = -1;
  let skipHeading = false;
  for (let i = 0; i < kept.length; i++) {
    if (LYRICS_HEADING.test(kept[i])) {
      start = i;
      skipHeading = true;
      break;
    }
    if (isSectionTag(kept[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;

  const styleLines = kept.slice(0, start).filter((l) => !SEPARATOR.test(l));
  const firstText = styleLines.findIndex((l) => l.trim());
  if (
    firstText >= 0 &&
    STYLE_HEADING.test(styleLines[firstText]) &&
    styleLines[firstText].length <= 60
  ) {
    const rest = styleLines
      .slice(firstText + 1)
      .join('\n')
      .trim();
    if (rest) styleLines.splice(firstText, 1);
  }
  const style = tidy(styleLines.join('\n'))
    .replace(/^(?:style(?: of music)?|prompt)\s*:\s*/i, '')
    .trim();
  const lyrics = tidy(
    kept
      .slice(skipHeading ? start + 1 : start)
      .filter((l) => !SEPARATOR.test(l))
      .join('\n')
  );
  if (!lyrics || !style) return null;
  return { style, lyrics, title };
}

const SMALL_WORDS = new Set(
  'a an the and or but nor of to in on at for by with as from into over'.split(' ')
);

function titleCase(line: string): string {
  return line
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** A title from the hook: the last sung line of the first chorus (or hook), else the most repeated line. */
export function suggestTitle(lyrics: string): string | null {
  const lines = lyrics.replace(/\r\n?/g, '\n').split('\n');
  const sung = (l: string) => {
    const t = l.trim();
    return !!t && !t.startsWith('[') && !/^\(.*\)$/.test(t);
  };
  let inChorus = false;
  let hook: string | null = null;
  for (const line of lines) {
    if (line.trim().startsWith('[')) {
      if (inChorus && hook) break;
      inChorus = /\b(chorus|hook|refrain)\b/i.test(line) && !/pre-?\s*chorus/i.test(line);
      continue;
    }
    if (inChorus && sung(line)) hook = line.trim();
  }
  if (!hook) {
    const counts = new Map<string, { n: number; line: string }>();
    for (const line of lines.filter(sung)) {
      const k = line.trim().toLowerCase();
      const c = counts.get(k) ?? { n: 0, line: line.trim() };
      c.n++;
      counts.set(k, c);
    }
    const best = [...counts.values()].sort((a, b) => b.n - a.n)[0];
    if (best && best.n > 1) hook = best.line;
  }
  if (!hook) return null;
  const clean = hook.replace(/[.,!?;:…]+$/u, '').trim();
  if (!clean) return null;
  const words = clean.split(/\s+/).slice(0, 8).join(' ');
  return titleCase(words).slice(0, 120);
}

/** Mirrors the server's stylePrompt(): description, then "Style: tags." and the sound character. */
export function sentStyle(prompt: string, tags: string[], character: SoundCharacter): string {
  return [
    prompt.trim(),
    tags.length ? 'Style: ' + tags.join(', ') + '.' : '',
    character === 'custom' ? '' : 'Sound character: ' + soundCharacterNames[character] + '.'
  ]
    .filter(Boolean)
    .join(' ');
}

export type FitLimits = { max_prompt: number; max_lyrics: number | null } | null | undefined;

/** Why the text does not fit a model, or null when it fits (or the model has no known limits). */
export function fitProblem(
  limits: FitLimits,
  styleLength: number,
  lyricsLength: number
): string | null {
  if (!limits) return null;
  if (styleLength > limits.max_prompt)
    return `Style is ${styleLength} characters with tags; this model takes ${limits.max_prompt}.`;
  if (limits.max_lyrics !== null && lyricsLength > limits.max_lyrics)
    return `Lyrics are ${lyricsLength} characters; this model takes ${limits.max_lyrics}.`;
  return null;
}

const norm = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‐-―-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const NEGATION = /(?:^|\s)(?:never|no|not|without|avoid|don't|dont|nothing)(?=\s|$)/;
const findWord = (haystack: string, needle: string) =>
  new RegExp(`(?<![a-z0-9&])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9&])`).test(
    haystack
  );
// Nouns that make a short phrase a sound description worth keeping as its own tag.
const SOUND_NOUNS =
  /\b(groove|grooves|keys|chords|drums?|beat|beats|bass|bassline|synths?|pads?|crawl|chop|chops|hums?|harmon(?:y|ies)|phrasing|verses?|choruses?|hooks?|runs|vocals?|voice|melod(?:y|ies)|guitars?|piano|strings|horns|brass|reverb|swing|bounce|texture|textures|production|mix|samples?|loops?|percussion|claps?|snares?|kicks?|hi-?hats?|808s?|organ|rhodes|choir|ad-?libs?|stabs?|riffs?|lead|arp|arps|sub|plucks?|atmosphere)\b/i;
const LEADING_VERB =
  /^(?:keep|use|make|let|add|give|go|have|put|stay|sing|start|end|save|build|bring)\b/i;
const CUT_AT =
  /(?: (?:deep|right|way|just|far|all))? (?:in|for|with|on|at|used|saved|that|which|to|like|over|under|from|into|while|but|blended|mixed|layered)\b.*$/i;

/**
 * Style tags for a style description: catalogue tags it mentions (not after "never", "no"…),
 * then short sound phrases ("underwater keys", "trip-hop crawl") as new tags. At most `limit`.
 */
export function tagsFromStyle(style: string, limit = MAX_STYLE_TAGS): string[] {
  const catalogue = [...new Set(styleCategories.flatMap((c) => c.tags))];
  // Positive parts only: drop each clause from a negation word onwards.
  const clauses = style
    .split(/[,;.\n—–:!?()]+|\s\/\s|\s-\s|\s(?:and|plus|&)\s/)
    .map((c) => norm(c))
    .map((c) => {
      const m = NEGATION.exec(c);
      return m ? c.slice(0, m.index).trim() : c;
    })
    .filter(Boolean);
  const positive = ' ' + clauses.join(' | ') + ' ';
  const voiced = style
    .split(/[.;\n]+/)
    .map((s) => norm(s))
    .filter((s) => /\b(vocals?|voice|singer|sung|singing)\b/.test(s));

  const picked: string[] = [];
  for (const tag of catalogue) {
    const t = norm(tag);
    let hit = findWord(positive, t);
    // "warm … female … vocal" in one sentence counts as "warm vocal" and "female vocal".
    if (!hit && t.endsWith(' vocal')) {
      const adjective = t.slice(0, -' vocal'.length);
      hit = voiced.some((sentence) => {
        const neg = NEGATION.exec(sentence);
        const kept = neg ? sentence.slice(0, neg.index) : sentence;
        return findWord(kept, adjective);
      });
    }
    if (hit) picked.push(tag);
  }
  // Drop a tag another picked tag already contains ("soul" inside "neo soul").
  const catalogueTags = picked.filter(
    (tag) => !picked.some((other) => other !== tag && findWord(norm(other), norm(tag)))
  );
  const covered = new Set(catalogueTags.flatMap((t) => norm(t).split(' ')));
  const genres = styleCategories.find((c) => c.id === 'genre')?.tags.map(norm) ?? [];

  const fresh: string[] = [];
  for (const clause of clauses) {
    const phrase = clause
      .replace(CUT_AT, '')
      .replace(/^(?:and|or|a|an|the|with)\s+/, '')
      .trim();
    if (!phrase || LEADING_VERB.test(phrase) || phrase.length > MAX_STYLE_TAG_LENGTH) continue;
    const words = phrase.split(' ');
    if (words.length > 4) continue;
    const isGenreWord = words.length <= 3 && genres.some((g) => findWord(phrase, g));
    if (!(words.length >= 2 && SOUND_NOUNS.test(phrase)) && !isGenreWord) continue;
    if (words.every((w) => covered.has(w))) continue;
    const original = phrase;
    if ([...catalogueTags, ...fresh].some((t) => norm(t) === original)) continue;
    fresh.push(original);
  }
  // Keep the original hyphenation the writer used ("trip-hop crawl", "alt-r&b").
  const restore = (tag: string) => {
    const m = new RegExp(
      tag
        .split(' ')
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[\\s‐-―-]+'),
      'i'
    ).exec(style);
    return m ? m[0].toLowerCase().replace(/\s+/g, ' ') : tag;
  };
  return [...catalogueTags, ...fresh.map(restore)].slice(0, limit);
}

/** At least this many characters arriving in one change counts as a paste, not typing. */
export const PASTE_CHARS = 40;

/** True when `next` came from a paste (or drop) into a box that held `previous`. */
export function isPaste(previous: string, next: string): boolean {
  return next.length - previous.length >= PASTE_CHARS;
}

/**
 * A whole prompt pasted into the Lyrics box: only when a real style description (a sentence or
 * a list, at least PASTE_CHARS long) comes before the lyrics, so a song's own first line is not
 * mistaken for a style.
 */
export function splitLyricsPaste(text: string): SplitPrompt | null {
  const split = splitFullPrompt(text);
  if (!split || split.style.length < PASTE_CHARS || !/[,.;]/.test(split.style)) return null;
  return split;
}

/**
 * Tags after a style paste: when the paste replaced the box, tags from the new text replace the
 * old ones; when it added to it, new tags are added after the existing ones (up to the limit).
 */
export function tagsAfterStylePaste(
  previous: string,
  next: string,
  currentTags: string[]
): string[] {
  const found = tagsFromStyle(next);
  if (!found.length) return currentTags;
  const replaced = !previous.trim() || !next.includes(previous.trim());
  if (replaced) return found;
  const have = new Set(currentTags.map((t) => t.toLowerCase()));
  return [...currentTags, ...found.filter((t) => !have.has(t.toLowerCase()))].slice(
    0,
    MAX_STYLE_TAGS
  );
}
