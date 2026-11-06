import { soundCharacterNames, type GenerationRequest } from '@vbm/contracts';

export function styleDescription(request: GenerationRequest): string {
  return request.prompt.trim() + '\nSound character: ' + soundCharacterNames[request.sound_character] + '.';
}

export function sungLyrics(request: GenerationRequest): string | null {
  const lyrics = request.lyrics?.trim();
  return request.mode === 'full-song' && lyrics ? lyrics : null;
}
