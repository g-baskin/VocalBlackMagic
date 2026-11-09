import { encodeWav } from './jobs';
import { withAudioRender } from './audio-render';
import { riffEvents, type RiffDraft } from './riff';

/** Synthesized preview, not a sample library or a generated finished song. Browser only. */
export async function renderRiff(draft: RiffDraft): Promise<Blob> {
  return withAudioRender(async () => {
    const Tone = await import('tone');
    const events = riffEvents(draft);
    if (!events.length) throw Error('Add a note before previewing or saving.');
    const seconds = (draft.settings.bars * 4 * 60) / draft.settings.bpm;
    const rendered = await Tone.Offline(
      () => {
        const limiter = new Tone.Limiter(-3).toDestination();
        const volume = new Tone.Gain(0.18).connect(limiter);
        const filter = new Tone.Filter(
          draft.settings.instrument === 'bass'
            ? 900
            : draft.settings.instrument === 'guitar'
              ? 2600
              : 5000,
          'lowpass'
        ).connect(volume);
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: draft.settings.instrument === 'keys' ? 'triangle' : 'sawtooth' },
          envelope: { attack: 0.004, decay: 0.12, sustain: 0.12, release: 0.05 }
        }).connect(filter);
        for (const note of events)
          synth.triggerAttackRelease(
            Tone.Frequency(note.midi, 'midi').toFrequency(),
            note.duration,
            note.time,
            note.velocity
          );
      },
      seconds,
      2,
      32000
    );
    const buffer = rendered.get();
    if (!buffer) throw Error('The browser could not render this riff.');
    return encodeWav(buffer);
  });
}
