import { describe, expect, test } from 'bun:test';
import type { GenerationRequest } from '@vbm/contracts';
import { buildLyriaPrompt } from './lyria';
import { separateLyriaDirections } from './lyria-directions';

const base: GenerationRequest = {
  prompt: 'Warm guitar rock with a quiet introduction.',
  lyrics: null,
  mode: 'full-song',
  engine: 'lyria-3.5',
  sound_character: 'custom',
  premium_studio: false,
  texture: 50,
  human_variation: 50,
  mastering_intensity: 0,
  duration_seconds: 120
};

const body = (prompt: string) =>
  prompt.split('Use these lyrics:\n')[1]?.split('\n\nTarget length:')[0];

describe('Lyria production directions are not sung lyrics', () => {
  test('moves bracketed guitar instructions out of the lyrics block', () => {
    const prompt = buildLyriaPrompt({
      ...base,
      lyrics:
        '[Intro – Guitar Alone]\n[Three accented notes, four palm-muted chugs. Repeat three times.\nDouble-time turnaround.]\n\n[Verse 1 – Low, gritty, restrained]\nA new day meets the sea\n(come with me)'
    });
    expect(body(prompt)).not.toContain('Three accented notes');
    expect(body(prompt)).not.toContain('Guitar Alone');
    expect(body(prompt)).not.toContain('Low, gritty');
    expect(body(prompt)).toContain('[Intro]');
    expect(body(prompt)).toContain('[Verse 1]\nA new day meets the sea\n(come with me)');
    const instructions = prompt.split('Use these lyrics:')[0];
    expect(instructions).toContain('Intro: Guitar Alone');
    expect(instructions).toContain('Intro: Three accented notes');
    expect(instructions).toContain('Double-time turnaround.');
    expect(instructions).toContain('Verse 1: Low, gritty, restrained');
    expect(instructions).toContain('Do not sing or speak');
  });

  test('keeps plain section labels and sung words unchanged', () => {
    const lyrics = '[Verse 2]\nThis is a test\n\n[Pre-Chorus]\n(oh oh)\n[Final Chorus]\nSing again';
    expect(body(buildLyriaPrompt({ ...base, lyrics }))).toBe(lyrics);
  });

  test('moves comma-separated section directions and inline square-bracket cues', () => {
    const prompt = buildLyriaPrompt({
      ...base,
      lyrics: '[Outro, playout, ear candy]\nStay [whisper softly] with me\n(still here)'
    });
    expect(body(prompt)).toBe('[Outro]\nStay  with me\n(still here)');
    expect(prompt.split('Use these lyrics:')[0]).toContain('Outro: whisper softly');
    expect(prompt.split('Use these lyrics:')[0]).toContain('Outro: playout, ear candy');
  });

  test('instrumental mode does not include supplied lyric text', () => {
    const prompt = buildLyriaPrompt({
      ...base,
      mode: 'instrumental',
      lyrics: '[Intro]\nNever sing this'
    });
    expect(prompt).toContain('Instrumental only, no vocals.');
    expect(prompt).not.toContain('Never sing this');
    expect(prompt).not.toContain('Use these lyrics:');
  });

  test('preserves unmatched bracket text rather than dropping words', () => {
    const input = '[Verse]\nKeep this line\n[unfinished note\nand these words';
    expect(separateLyriaDirections(input).lyrics).toBe(input);
    expect(separateLyriaDirections(input).hasWords).toBe(true);
  });

  test('associates repeated-section directions in their original order', () => {
    const result = separateLyriaDirections(
      '[Chorus]\n[Quiet]\nSing once\n[Chorus]\n[Loud]\nSing twice'
    );
    expect(result.directions).toEqual(['Chorus: Quiet', 'Chorus: Loud']);
    expect(result.lyrics).toContain('Sing once');
    expect(result.lyrics).toContain('Sing twice');
  });

  test('notes-only input does not ask Lyria to invent words', () => {
    const prompt = buildLyriaPrompt({ ...base, lyrics: '[Intro]\n[Guitar only. No singing.]' });
    expect(prompt).toContain('No sung words were supplied. Do not invent lyrics.');
    expect(prompt).not.toContain('Use these lyrics:');
    expect(prompt).not.toContain('Write original lyrics');
  });
});
