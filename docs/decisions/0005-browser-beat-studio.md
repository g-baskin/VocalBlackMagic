# 0005. Build the Beats workspace on plain Web Audio in the browser

Recorded: 2026-11-09

## Status

Accepted. Applies to TTB Studio only; consistent with [0002](0002-modular-monolith.md) and [0003](0003-runtime-boundary.md).

## Context

TTB Studio needed a place to make beats by hand: a step sequencer, a piano roll, a playlist that arranges patterns into a song, a mixer, and MIDI in and out, in the spirit of FruityLoops 3 to 5. It already had Pads, a browser sampler with a sound library, and the dependencies `tone`, `tonal` and `@tonejs/midi`.

Forces at play:

- Timing must be steady while the page is busy. A browser timer alone drifts by tens of milliseconds.
- WAV export must sound like playback; two separate code paths would drift apart.
- The studio has no authentication, so new server work should stay small and add no paid calls.
- No new dependencies unless they are needed.

## Decision

Beats runs entirely in the browser on plain Web Audio:

- **One data model.** `packages/contracts/src/beats.ts` defines the project: channels (instrument and mixer strip), patterns (notes per channel in ticks at 96 per quarter note) and playlist clips. A step is a note on the channel's root key, one 16th long, so the channel rack and the piano roll edit the same notes. `validateBeatProject` refuses out-of-range values and unknown schema versions instead of clamping them.
- **One sound path.** Voices (3-oscillator synth, drum synth, sampler) and the mixer take a `BaseAudioContext`. Live play uses an `AudioContext`; WAV export renders the same graph on an `OfflineAudioContext`.
- **Lookahead scheduling.** A 25 ms timer queues every note due in the next 120 ms at audio-clock times. Live play is capped at 64 voices, stealing the oldest.
- **MIDI.** Web MIDI and the computer keyboard play the selected channel. `.mid` files are read and written with the existing `@tonejs/midi`; channel 10 maps to drum channels by General MIDI note.
- **Storage.** The server only stores projects: `BeatStore` writes validated JSON atomically to `data/studio/beats/<uuid>.json`, behind the same `guard()` as every studio route, and drops fields it does not know.

Tone.js is not used for the engine.

## Consequences

- Playback, recording and export work offline and cost nothing per use.
- Timing depends on the browser's audio clock, not on the page staying idle.
- The built-in instruments are simple synthesis; they will not match commercial plugins.
- Safari has no Web MIDI; the computer keyboard still plays.
- Projects are local files with the studio's usual limits: development only, no authentication, no tenancy.
- Limits are fixed in the contract: 32 channels, 99 patterns, 20,000 notes and 512 clips.

## Alternatives

- **Tone.js Transport and instruments.** These are already installed and well tested. They would add a second scheduler and a separate offline path, and give less control over voice stealing and the shared export path.
- **Server-side rendering with ffmpeg or a Python worker.** Export would not depend on the browser, but playback would no longer match what is heard, and it would mean new process work for no gain in development.
- **A WebAssembly DAW engine.** It would be faster, but it adds a large dependency and a build step the project does not need yet.
