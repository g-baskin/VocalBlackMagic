import { expect, test } from 'bun:test';
import { soundCharacters, validateGenerationRequest, type GenerationRequest } from './index';
const base: GenerationRequest = {
  prompt: 'Warm analog hip hop with live-room drums',
  lyrics: null,
  mode: 'instrumental',
  engine: 'ace-step',
  sound_character: 'raw',
  premium_studio: false,
  texture: 70,
  human_variation: 65,
  mastering_intensity: 25,
  duration_seconds: 120
};
test('five sound characters are selectable', () => expect(soundCharacters).toHaveLength(5));
test('valid request passes', () => expect(validateGenerationRequest(base)).toBeNull());
test('out-of-range intensity fails', () => expect(validateGenerationRequest({ ...base, mastering_intensity: 101 })).not.toBeNull());
test('too-short prompts fail', () => expect(validateGenerationRequest({ ...base, prompt: 'x' })).not.toBeNull());
test('lyria engine is accepted', () => expect(validateGenerationRequest({ ...base, engine: 'lyria-3.5' })).toBeNull());
test('song length outside 10 to 240 seconds fails', () => {
  expect(validateGenerationRequest({ ...base, duration_seconds: 9 })).not.toBeNull();
  expect(validateGenerationRequest({ ...base, duration_seconds: 241 })).not.toBeNull();
  expect(validateGenerationRequest({ ...base, duration_seconds: 60.5 })).not.toBeNull();
});
