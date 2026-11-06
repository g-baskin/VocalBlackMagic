import assert from 'node:assert/strict';
import { test } from 'node:test';
import { soundCharacters, validateGenerationRequest, type GenerationRequest } from './index.ts';
const base: GenerationRequest = {
  prompt: 'Warm analog hip hop with live-room drums',
  lyrics: null,
  mode: 'instrumental',
  engine: 'ace-step',
  sound_character: 'raw',
  premium_studio: false,
  texture: 70,
  human_variation: 65,
  mastering_intensity: 25
};
test('five sound characters are selectable', () => assert.equal(soundCharacters.length, 5));
test('valid request passes', () => assert.equal(validateGenerationRequest(base), null));
test('out-of-range intensity fails', () => assert.notEqual(validateGenerationRequest({ ...base, mastering_intensity: 101 }), null));
test('too-short prompts fail', () => assert.notEqual(validateGenerationRequest({ ...base, prompt: 'x' }), null));
