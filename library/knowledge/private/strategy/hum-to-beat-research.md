# Hum to Beat: turning a hum, chant or beatbox into a beat

> Category: Strategy | Version: 1.0 | Date: 2026-11-09 | Status: Research. No plan approved, nothing built.

For the owner and engineers. The owner asked whether an artist could hum, chant or beatbox a tune and have the app analyse it and turn it into a real sound or beat they are using or want to use. This note covers what already exists, which open-source parts could do it, what VBM already has, and a suggested shape for the feature. It is research, not a PRD.

**Related:**
- [`../architecture/song-studio.md`](../architecture/song-studio.md) (TTB Studio API, models, edits)
- Open PRs [#13 Pads](https://github.com/g-baskin/VocalBlackMagic/pull/13), [#14 Beats (A)](https://github.com/g-baskin/VocalBlackMagic/pull/14), [#15 Beats (B)](https://github.com/g-baskin/VocalBlackMagic/pull/15)

---

## Short answer

Yes. Tools that do this exist, in three kinds:

1. **Beatbox to drums.** Mouth sounds ("boots", "cats", "k") become kick, hi-hat and snare hits.
2. **Hum to melody.** A hummed or sung line becomes notes that any instrument can play.
3. **Hum to song.** A hum is used as a reference, and a music model builds a full track around it.

VBM has none of these yet, but the Beats page (PRs #14 and #15) already has nearly everything around them. The missing piece is the step that listens to a voice and turns it into notes or drum hits.

## What VBM has today (checked 2026-11-09)

On `main` (`7ff7643`):
- **Riff creator** (`apps/ttb-studio/src/routes/riffs`, `lib/client/riff.ts`) makes seeded random riffs in a chosen key and scale. It does not listen to audio.
- **PitchTrace** (`packages/ui/src/PitchTrace.svelte`) draws pitch on screen. It does not produce notes.
- `tone`, `tonal` and `@tonejs/midi` are already dependencies. `tonal` can snap notes to a key and scale.

On `feature/beat-studio-song` (PR #15, stacked on #14 and #13; head `2becde4`):
- Channel Rack step sequencer, Piano Roll, drum synth, 3-oscillator synth and a sampler that plays Pads sounds.
- Live MIDI and computer-keyboard play, recording into the Piano Roll, `.mid` import and export.
- **Send to Create**: renders a beat into the Library and opens Create with it as the music reference (fal ACE-Step `audio-to-audio`).

So a voice-to-notes step could drop its result straight into a Beats pattern. From there the artist picks the sound (any synth, drum or Pads sample) and can send the beat on to Create for a full song.

## Tools on the market

From general product knowledge as of mid-2026. Features and prices were **not** re-checked on 2026-11-09. Use these for inspiration only; do not copy their code, text or assets.

| Tool | What it does | Kind |
| --- | --- | --- |
| Vochlea Dubler 2 | Live voice to MIDI. The user trains their own beatbox sounds as drum triggers; hummed pitch becomes notes. Commercial plugin and app. | 1, 2 |
| Ableton Live | "Convert Drums to MIDI", "Convert Melody to MIDI" and "Convert Harmony to MIDI" on recorded audio. | 1, 2 |
| Logic Pro | Flex Pitch can turn a vocal into MIDI; Drum Replacement turns hits into drum triggers. | 1, 2 |
| Celemony Melodyne | Detects notes in audio and exports MIDI. | 2 |
| Google Tone Transfer (Magenta, built on DDSP) | Makes a hum sound like a violin, saxophone, flute or trumpet, keeping the performance. | 2 |
| Suno | Upload audio (a hum works) and cover or extend it into a full song. No official public API. | 3 |
| Reference-audio music models (MiniMax Music, ACE-Step audio-to-audio, Stable Audio 2.5 audio-to-audio) | Generate music guided by an uploaded clip. Results from a bare hum vary. | 3 |

**Lesson from Dubler:** a short setup step, where the user performs each beatbox sound a few times, is what makes beatbox recognition accurate for a particular voice.

## Open-source building blocks

Licenses checked on 2026-11-09 through the GitHub API and the npm registry. VBM is AGPL-3.0-or-later, so Apache-2.0 and MIT parts can be used with credit in `THIRD_PARTY_NOTICES.md`. Non-commercial licenses cannot be used in the product.

| Part | License | Use | Notes |
| --- | --- | --- | --- |
| Spotify Basic Pitch, TypeScript (`@spotify/basic-pitch` 1.0.1, [spotify/basic-pitch-ts](https://github.com/spotify/basic-pitch-ts)) | Apache-2.0 | Audio to MIDI notes, including pitch bends. Runs in the browser on TensorFlow.js. | **Usable.** The TS repo was last updated in May 2023; the Python repo ([spotify/basic-pitch](https://github.com/spotify/basic-pitch)) is still maintained. Adds TensorFlow.js and a model file to the page. |
| Magenta DDSP ([magenta/ddsp](https://github.com/magenta/ddsp)) | Apache-2.0 | Timbre transfer ("make my hum sound like a sax"). | **Usable, later.** Python and TensorFlow, so it would run server-side or on the self-hosted engine. |
| ACE-Step v1 ([ace-step/ACE-Step](https://github.com/ace-step/ACE-Step)), ACE-Step 1.5 ([ace-step/ACE-Step-1.5](https://github.com/ace-step/ACE-Step-1.5)) | Apache-2.0, MIT | Hum or beat as a reference for a full song. | **Usable.** Already used through fal (`fal-ai/ace-step/audio-to-audio` for Restyle; mock-tested only, per the README). |
| Meta AudioCraft MusicGen-melody ([facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft)) | Code MIT; **model weights CC BY-NC 4.0** | Built for hum-to-music. | **Do not use.** The weights are non-commercial only. |
| IRCAM RAVE ([acids-ircam/RAVE](https://github.com/acids-ircam/RAVE)) | **CC BY-NC 4.0** | Real-time timbre transfer. | **Do not use.** Non-commercial only. |
| Beatbox hit detection | No library needed | Find each hit (onset detection, for example spectral flux), then sort it into kick, snare or hat by comparing it with the user's own recorded examples. | Can be built with plain Web Audio, matching the "no new dependencies" approach of Pads and Beats. Public beatbox datasets exist; check each one's license before using it. |

## Suggested feature: "Hum It"

A record button on the Beats page, with three modes. The user records from the microphone or uploads a clip.

1. **Beatbox → drums (local, free).**
   - First use: a short setup asks the user to perform kick, snare and hat a few times each, and saves those examples for that user.
   - Record, find each hit, sort it into kick, snare or hat, then snap the hits to the tempo and step grid.
   - Result: a new pattern in the Channel Rack using the drum synth or the user's chosen Pads samples.
2. **Hum → melody (local, free).**
   - Basic Pitch turns the recording into notes.
   - Clean-up: drop very short notes, merge repeats, snap to the chosen key and scale with `tonal`, and quantise to the grid.
   - Result: notes in the Piano Roll on a channel whose sound the user picks (synth, sampler or Pads sound).
3. **Hum → song (paid per use).**
   - Send the raw recording, or the beat built from modes 1 and 2, to the existing reference paths: fal ACE-Step `audio-to-audio` (Restyle) or MiniMax Music-01 with a music reference.
   - Uses the existing paid-job guards and cost display.

**Later:** a "sound like an instrument" mode using DDSP, run server-side or on the self-hosted engine.

### Rules that should carry over
- Keep the raw recording as the original and make every result a new version (AGENTS.md: preserve source audio).
- A hum used to make notes is not voice cloning. It must not be used to train or condition a voice without the existing own-voice consent flow.
- No fake results: if detection finds nothing usable, say so instead of inventing notes.
- The microphone needs a secure context. `localhost` works in development; production needs HTTPS.

## Risks and unknowns
- **Hums are messy.** Breathy or wavering hums give extra or wrong notes; clean-up and key snapping will matter more than the model itself.
- **Beatbox sorting without setup is unreliable.** The per-user setup step is what makes it work.
- **Basic Pitch would be the first big client-side dependency** in Beats (TensorFlow.js plus model weights). Load time and memory need measuring, including on the Intel Mac and on phones.
- **Hum → song quality is unproven.** The Restyle path has only been mock-tested, and a bare hum gives the model little to work with. A rough beat from modes 1 and 2 is probably a better reference.
- **Depends on unmerged work.** Beats (PRs #14, #15) and Pads (#13) need to merge first.

## Suggested order
1. Beatbox → drums (no new dependencies, fits the step sequencer directly).
2. Hum → melody with Basic Pitch.
3. Hum → song through the existing reference paths.
4. Instrument-sound mode with DDSP.

## Sources
- Licenses: GitHub API repository metadata and `LICENSE` / `LICENSE_weights` files for the repositories linked above; npm registry entry for `@spotify/basic-pitch`. Checked 2026-11-09.
- VBM state: `main` at `7ff7643` and `origin/feature/beat-studio-song` at `2becde4`; open PR list from GitHub on 2026-11-09.
- Market tools: general product knowledge, not re-checked on 2026-11-09.
