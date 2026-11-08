import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  fitProblem,
  isSectionTag,
  sentStyle,
  splitFullPrompt,
  suggestTitle,
  tagsFromStyle
} from './full-prompt';

const sample = readFileSync(join(import.meta.dir, '__fixtures__/full-prompt.txt'), 'utf8');

describe('pasting a full prompt', () => {
  test('splits the style block, drops the heading, separator and Lyrics heading', () => {
    const split = splitFullPrompt(sample);
    expect(split).not.toBeNull();
    const { style, lyrics, title } = split!;
    expect(style.startsWith('Warm, intimate, emotionally textured')).toBe(true);
    expect(style.endsWith('emotionally clear.')).toBe(true);
    expect(style).not.toContain('Voc+Production Prompt');
    expect(style).not.toContain('====');
    expect(lyrics.startsWith('[Intro]\n\n[Verse 1]\nI made my face behave at work')).toBe(true);
    expect(lyrics).toContain('[Outro, playout, ear candy, impact pop]\n(look at me.....)');
    expect(lyrics).not.toMatch(/^Lyrics$/m);
    expect(title).toBeNull();
  });

  test('suggests the hook as a title', () => {
    expect(suggestTitle(splitFullPrompt(sample)!.lyrics)).toBe("I'm Smiling Through the Static");
    expect(suggestTitle('[Verse]\nno chorus here\nonly once')).toBeNull();
    expect(suggestTitle('[Verse]\nsay it again\nsay it again')).toBe('Say It Again');
  });

  test('works without heading or separator, and reads a Title line', () => {
    const split = splitFullPrompt(
      'Title: "Night Drive"\nDreamy synthwave, female vocal\n[Chorus]\nla la'
    );
    expect(split).toEqual({
      style: 'Dreamy synthwave, female vocal',
      lyrics: '[Chorus]\nla la',
      title: 'Night Drive'
    });
    expect(splitFullPrompt('Style: lo-fi soul\n\nLyrics:\nhello world')).toEqual({
      style: 'lo-fi soul',
      lyrics: 'hello world',
      title: null
    });
  });

  test('does not split plain style text or lyrics-only text', () => {
    expect(splitFullPrompt('Upbeat pop with [bright] synths and a big chorus')).toBeNull();
    expect(splitFullPrompt('[Verse]\nonly lyrics\n[Chorus]\nhey')).toBeNull();
  });

  test('section tags, with and without descriptors', () => {
    for (const t of [
      '[Verse 1]',
      '[Final Chorus]',
      '[Pre-Chorus]',
      '[Outro, playout, ear candy]',
      '[Hook]'
    ])
      expect(isSectionTag(t)).toBe(true);
    for (const t of ['[bright]', '[x] verse', 'Verse 1']) expect(isSectionTag(t)).toBe(false);
  });

  test('length check mirrors what the server sends', () => {
    const style = sentStyle('Warm R&B', ['soul', 'piano'], 'live');
    expect(style).toBe('Warm R&B Style: soul, piano. Sound character: Live / Organic.');
    expect(sentStyle('Warm R&B', [], 'custom')).toBe('Warm R&B');
    const minimax = { max_prompt: 300, max_lyrics: 600 };
    expect(fitProblem(minimax, 301, 10)).toContain('takes 300');
    expect(fitProblem(minimax, 100, 601)).toContain('takes 600');
    expect(fitProblem(minimax, 300, 600)).toBeNull();
    expect(fitProblem({ max_prompt: 1000, max_lyrics: null }, 10, 99999)).toBeNull();
    expect(fitProblem(null, 99999, 99999)).toBeNull();
  });
});

describe('tags from a pasted prompt', () => {
  const tags = tagsFromStyle(splitFullPrompt(sample)!.style);

  test('selects catalogue tags the prompt names', () => {
    for (const tag of ['r&b', 'neo soul', 'female vocal', 'warm vocal', 'intimate', 'cinematic'])
      expect(tags).toContain(tag);
  });

  test('never selects what the prompt rules out', () => {
    for (const tag of ['rap', 'rapping', 'male vocal', 'pop', 'soprano'])
      expect(tags).not.toContain(tag);
    expect(tags).not.toContain('soul'); // already inside "neo soul"
  });

  test('creates new tags for sound phrases not in the list', () => {
    for (const tag of [
      'underwater keys',
      'suspended chords',
      'trip-hop crawl',
      'call-response hums',
      'legato phrasing'
    ])
      expect(tags).toContain(tag);
    expect(tags.length).toBeLessThanOrEqual(20);
    expect(tags.every((t) => t.length <= 40)).toBe(true);
    expect(new Set(tags).size).toBe(tags.length);
  });

  test('plain short styles give plain tags', () => {
    expect(tagsFromStyle('Upbeat pop, no drums, female vocal')).toEqual([
      'pop',
      'upbeat',
      'female vocal'
    ]);
  });
});
