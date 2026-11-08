import { describe, expect, test } from 'bun:test';
import type { GenerationRequest } from '@vbm/contracts';
import { styleDescription } from './prompt';
import { stylePrompt } from '../studio/engines';

const base: GenerationRequest = {
  prompt: 'Soulful pop ballad, sparse piano. ',
  lyrics: null,
  mode: 'full-song',
  engine: 'lyria-3.5',
  sound_character: 'live',
  premium_studio: false,
  texture: 50,
  human_variation: 50,
  mastering_intensity: 0,
  duration_seconds: 120
};

describe('sound character in prompts', () => {
  test('a chosen character is added once', () => {
    expect(styleDescription(base)).toBe(
      'Soulful pop ballad, sparse piano.\nSound character: Live / Organic.'
    );
  });

  test('"custom" adds nothing, so a routed prompt keeps only the user\'s choice', () => {
    const routedPrompt = stylePrompt({
      prompt: 'Soulful pop ballad',
      style_tags: ['soul', 'ballad'],
      sound_character: 'live'
    });
    const sent = styleDescription({ ...base, prompt: routedPrompt, sound_character: 'custom' });
    expect(sent).toBe('Soulful pop ballad Style: soul, ballad. Sound character: Live / Organic.');
    expect(sent.match(/Sound character/g)).toHaveLength(1);
  });

  test('choosing Custom sends just the description and tags', () => {
    expect(
      stylePrompt({ prompt: 'Soulful pop ballad', style_tags: [], sound_character: 'custom' })
    ).toBe('Soulful pop ballad');
  });
});
