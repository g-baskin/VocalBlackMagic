import { describe, expect, test } from 'bun:test';
import {
  MAX_STYLE_TAG_LENGTH,
  MAX_STYLE_TAGS,
  hasTag,
  parseTags,
  searchTags,
  styleCategories,
  toggleTag
} from './style-tags';

describe('style tag catalogue', () => {
  test('every tag is lower case, fits the contract and appears once', () => {
    const all = styleCategories.flatMap((c) => c.tags);
    expect(all.length).toBeGreaterThan(200);
    for (const tag of all) {
      expect(tag).toBe(tag.trim().toLowerCase());
      expect(tag.length).toBeLessThanOrEqual(MAX_STYLE_TAG_LENGTH);
      expect(tag).not.toContain(',');
    }
    expect(new Set(all).size).toBe(all.length);
  });

  test('parseTags trims, drops blanks and case-insensitive repeats, and caps the count', () => {
    expect(parseTags(' pop, ,Pop,  dark vocal ')).toEqual(['pop', 'dark vocal']);
    const many = Array.from({ length: 30 }, (_, i) => `tag${i}`).join(',');
    expect(parseTags(many)).toHaveLength(MAX_STYLE_TAGS);
  });

  test('toggleTag adds, removes regardless of case, and keeps hand-typed tags', () => {
    let text = 'my own vibe, pop';
    text = toggleTag(text, 'jazz');
    expect(text).toBe('my own vibe, pop, jazz');
    expect(hasTag(text, 'JAZZ')).toBe(true);
    text = toggleTag(text, 'Pop');
    expect(text).toBe('my own vibe, jazz');
    expect(toggleTag('', '  ')).toBe('');
  });

  test('adding stops at the limit, removing still works there', () => {
    const full = Array.from({ length: MAX_STYLE_TAGS }, (_, i) => `t${i}`).join(', ');
    expect(toggleTag(full, 'extra')).toBe(full);
    expect(parseTags(toggleTag(full, 't0'))).toHaveLength(MAX_STYLE_TAGS - 1);
  });

  test('searchTags finds matches across categories and ignores empty queries', () => {
    expect(searchTags('  ')).toEqual([]);
    const hits = searchTags('Vocal');
    expect(hits.map((h) => h.category.id)).toEqual(['instruments', 'voice', 'tone']);
    expect(hits.find((h) => h.category.id === 'tone')?.tags).toContain('airy vocal');
  });
});
