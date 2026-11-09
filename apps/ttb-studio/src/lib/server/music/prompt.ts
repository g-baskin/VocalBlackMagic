import { soundCharacterNames, type GenerationRequest } from '@vbm/contracts';

/**
 * Style text plus the sound character. "Custom" means "just my description", so it adds no line;
 * routed runners also pass 'custom' because their prompt already carries the user's choice.
 */
export function styleDescription(request: GenerationRequest): string {
  const prompt = request.prompt.trim();
  if (request.sound_character === 'custom') return prompt;
  return prompt + '\nSound character: ' + soundCharacterNames[request.sound_character] + '.';
}

export function sungLyrics(request: GenerationRequest): string | null {
  const lyrics = request.lyrics?.trim();
  return request.mode === 'full-song' && lyrics ? lyrics : null;
}
