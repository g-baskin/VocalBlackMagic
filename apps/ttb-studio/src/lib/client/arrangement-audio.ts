import { encodeWav } from './jobs';
import { withAudioRender } from './audio-render';
import { arrangementEvents, arrangementSeconds, type Arrangement } from './arrangement';

/** Bounded on-device synth render. No samples, network calls or AI generation. */
export async function renderArrangement(project: Arrangement): Promise<Blob> {
  return withAudioRender(async () => {
    const events = arrangementEvents(project); // Validate before allocating an audio buffer.
    const Tone = await import('tone');
    const rendered = await Tone.Offline(
      () => {
        const limiter = new Tone.Limiter(-3).toDestination();
        const gain = () => new Tone.Gain(0.16).connect(limiter);
        const filter = new Tone.Filter(
          project.source.settings.instrument === 'bass' ? 900 : 3000,
          'lowpass'
        ).connect(gain());
        const riff = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: project.source.settings.instrument === 'keys' ? 'triangle' : 'sawtooth'
          },
          envelope: { attack: 0.004, decay: 0.12, sustain: 0.12, release: 0.05 }
        }).connect(filter);
        const bass = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.08 }
        }).connect(gain());
        const chords = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.04, decay: 0.2, sustain: 0.2, release: 0.1 }
        }).connect(gain());
        for (const [name, synth] of [
          ['riff', riff],
          ['bass', bass],
          ['chords', chords]
        ] as const)
          for (const note of events[name])
            synth.triggerAttackRelease(
              Tone.Frequency(note.midi, 'midi').toFrequency(),
              note.duration,
              note.time,
              note.velocity
            );
        const kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 5 }).connect(gain());
        const snare = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.01 }
        }).connect(new Tone.Filter(1500, 'highpass').connect(gain()));
        const hat = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 }
        }).connect(new Tone.Filter(6500, 'highpass').connect(gain()));
        for (const note of events.drums) {
          if (note.midi === 36)
            kick.triggerAttackRelease('C1', note.duration, note.time, note.velocity);
          else
            (note.midi === 38 ? snare : hat).triggerAttackRelease(
              note.duration,
              note.time,
              note.velocity
            );
        }
      },
      arrangementSeconds(project) + 0.25,
      2,
      32000
    );
    const buffer = rendered.get();
    if (!buffer)
      throw Error('The browser could not render this arrangement. Export MIDI to keep your work.');
    return encodeWav(buffer);
  });
}
