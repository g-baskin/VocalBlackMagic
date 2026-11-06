import { soundCharacters, type TTBCapabilities } from '@vbm/contracts';

export interface ProviderConfig {
  falConfigured: boolean;
  lyriaConfigured: boolean;
  generationAllowed: boolean;
}

export function buildCapabilities(config: ProviderConfig): TTBCapabilities {
  const hosted = (configured: boolean, key: string) =>
    !config.generationAllowed ? 'disabled outside development' : configured ? 'ready' : 'needs ' + key;
  return {
    architecture: 'hosted-providers',
    engines: [
      { id: 'ace-step', name: 'ACE-Step via fal (about $0.0002 per second)', status: hosted(config.falConfigured, 'FAL_KEY') },
      { id: 'lyria-3.5', name: 'Google Lyria 3.5 ($0.08 per song)', status: hosted(config.lyriaConfigured, 'GEMINI_API_KEY') },
      { id: 'heartmula', name: 'HeartMuLa', status: 'not-configured' },
      { id: 'external-v2', name: 'External V2 (provider to verify)', status: 'not-configured' }
    ],
    sound_characters: [...soundCharacters],
    premium_studio: { selectable: true, processing_ready: false },
    generation_ready: config.generationAllowed && (config.falConfigured || config.lyriaConfigured)
  };
}
