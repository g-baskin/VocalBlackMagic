import { describe, expect, test } from 'bun:test';
import { artistEntries, findArtists, rewritePrompt, rewriteTagText } from './artist-styles';
import { MAX_STYLE_TAGS, parseTags, styleCategories } from './style-tags';

const catalogue = new Set(styleCategories.flatMap((c) => c.tags));

describe('artist names in prompts', () => {
  test('every preset tag exists in the style tag catalogue', () => {
    for (const { name, preset } of artistEntries) {
      for (const tag of preset.tags) expect(`${name}: ${catalogue.has(tag)}`).toBe(`${name}: true`);
      expect(preset.description).not.toMatch(/[—–]/);
    }
  });

  test('"like <artist>" is removed and the sound is described instead', () => {
    const fix = rewritePrompt('woman singing like adele about her past lover');
    expect(fix.hits.map((h) => h.name)).toEqual(['Adele']);
    expect(fix.text).toStartWith('Woman singing about her past lover, a soulful pop ballad');
    expect(fix.text.toLowerCase()).not.toContain('adele');
  });

  test('bare names become a style inline, with the article fixed', () => {
    expect(rewritePrompt('An Adele song about heartbreak').text).toBe(
      'A soulful pop song about heartbreak'
    );
    expect(rewritePrompt('a Beyoncé anthem').text).toBe('A smooth pop r&b anthem');
  });

  test('suffix forms, accents, punctuation and "sounds like" are handled', () => {
    expect(findArtists('Beyonce-style anthem').map((h) => h.name)).toEqual(['Beyonce']);
    expect(findArtists('ac dc vibes').map((h) => h.name)).toEqual(['AC/DC']);
    expect(findArtists('a Rosalía-inspired track').map((h) => h.name)).toEqual(['Rosalia']);
    expect(rewritePrompt("make it sound like the Weeknd's voice, dark").text).toBe(
      'Make it sound like moody synth r&b, dark'
    );
  });

  test('everyday words are not mistaken for artists', () => {
    for (const text of [
      'a song about the queen and the future',
      'I love her voice',
      'like prince charming',
      'behind the scenes bts footage',
      'an upbeat summer pop song about road trips',
      'usher in a new era'
    ])
      expect(findArtists(text)).toEqual([]);
    expect(findArtists('Song like Queen').map((h) => h.name)).toEqual(['Queen']);
    expect(findArtists('drake type beat').map((h) => h.name)).toEqual(['Drake']);
  });

  test('text without artists is returned unchanged', () => {
    expect(rewritePrompt('a lullaby')).toEqual({ text: 'a lullaby', hits: [] });
  });

  test('tags naming artists are swapped for style tags within the limit', () => {
    const fix = rewriteTagText('pop, adele, sad');
    expect(fix.hits.map((h) => h.name)).toEqual(['Adele']);
    const tags = parseTags(fix.text);
    expect(tags).not.toContain('adele');
    expect(tags.slice(0, 2)).toEqual(['pop', 'sad']);
    expect(tags).toContain('powerful vocal');
    const full = Array.from({ length: MAX_STYLE_TAGS - 1 }, (_, i) => `t${i}`).join(', ');
    expect(parseTags(rewriteTagText(full + ', Drake type beat').text)).toHaveLength(MAX_STYLE_TAGS);
  });
});
