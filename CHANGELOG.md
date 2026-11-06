# Changelog

This log describes repository changes, not verified public releases. No release tags or GitHub releases existed when it was introduced. See [Release procedure](docs/RELEASING.md).

## Unreleased

### Added (design docs)
- `docs/DESIGN.md`: Mermaid diagrams of both apps, the request guard, song creation and derivations, the Vocal Fix repair and Voice Forge flows, job states, the data layout and the design system. GitHub renders them, and both apps show the same diagrams in the arcane theme at `/arcana` (shared `MermaidDiagram` and `DesignCodex` components in `@vbm/ui`, Mermaid loaded only on that page).

### Added (TTB Studio, development only)
- Replicate provider (create, poll, cancel, file upload, throttle retry) with engines MiniMax Music 1.5, ACE-Step, Stable Audio 2.5 and Lyria 2; `REPLICATE_API_TOKEN` in `apps/ttb-studio/.env`.
- Persistent song library under `data/studio/songs/<id>/` with list, rename, favourite, delete and Range audio streaming.
- Create screen (Simple and Custom modes, 1 or 2 takes), Library, Song detail and Lyrics workshop, in the Vocal Black Magic arcane design.
- Lyrics by Claude 3.5 Haiku on Replicate, falling back to Claude 4.5 Haiku when the first fails.
- Derived songs: Demucs stems with a stem mixer and WAV mix export, Reimagine (MiniMax Music-01), local ffmpeg Studio Master with A/B, and Sing in my voice (realistic-voice-cloning) for ready, own-voice-consented voices from the shared registry, recording the voice id and consent reference.
- Cover art from FLUX Schnell on Replicate (optional on create, about $0.003 each; re-conjure from the song page). Derived songs copy their parent's cover.
- Summon in my voice: Custom mode can sing a new song in a forged voice with MiniMax Music-01, using a 30 s excerpt of the voice's Gold Vocal and a music reference from the library (its drums, bass and other stems when split). Only ready, own-voice-consented voices; the voice id and consent session are recorded.
- Lyrics fall back to Claude 4.5 Haiku when Claude 3.5 Haiku fails on Replicate.

### Security (TTB Studio)
- Studio routes refuse any Host header other than localhost, 127.0.0.1 or [::1] (DNS-rebinding guard), in addition to the development-only gate and JSON-only paid requests.
- At most 3 paid jobs may run at once; further requests get 429.
- Remote downloads are limited to Replicate's output hosts and read with size caps (audio 160 MiB, covers 8 MiB).

### Changed
- TTB Studio now uses ACE-Step 1.5 on fal with song planning on (about $0.0006 per second). Complete songs without lyrics get original lyrics written by Gemini 3.5 Flash-Lite first, shown under the player, so songs have real sung words instead of wordless vocals. Lyria is also told to write clear lyrics when none are given.
- Audio that starts with an ID3 tag is now identified by the format inside it, so ACE-Step 1.5's FLAC files play instead of showing 0:00.
- If fal rejects a song after its lyrics were written, the lyrics are returned and placed in the lyrics box, so a retry does not pay for them again.

### Added
- Vocal Fix now runs a real pipeline in its SvelteKit server (development only, no authentication):
  - ffprobe intake validation with a full-decode check;
  - diagnosis of loudness, clipping, noise and silence with timestamped findings;
  - staged, cancellable repair jobs (Demucs isolation and resemble-enhance on Replicate, then a local ffmpeg polish preset) with before/after scores;
  - Gold Vocal phrase ranking and assembly with source timestamps;
  - a descriptive voice profile;
  - consent-gated RVC voice training that writes the shared voice registry `data/shared/voices/` (`VoiceModel`, with a local `model_file`, in `@vbm/contracts`).
- Vocal Fix local repair adapts denoise and a between-phrase gate to the measured noise floor, applies capped make-up gain after denoise, and never silently makes a take worse: a stronger retry runs when noise, clipping or overall drops by more than 5 points, and a remaining drop is reported as a finding.
- Vocal Fix runs at most 2 jobs at once (1 forge) and queues the rest. Job status is saved to `data/vocal-fix/jobs/`, and jobs interrupted by a restart are marked failed.
- Vocal Fix accepts browser recordings (WebM/Opus, OGG, M4A) and transcodes them to WAV for processing. Its audio route supports byte ranges for seeking.
- Vocal Fix API routes refuse non-loopback Host headers (DNS rebinding) and stream-cap uploads.
- Vocal Fix intake and diagnosis screens in the arcane design, with waveform problem regions, spectrogram, pitch trace and A/B comparison. Tested end to end with an AI-generated synthetic voice. See ADR 0004.
- TTB Studio hosted song generation through fal (ACE-Step) and Google Lyria 3.5, with job status polling, audio format verification and in-browser playback. Development only; keys come from `FAL_KEY` and `GEMINI_API_KEY`.

### Fixed
- Lyria requests from a Google project without billing now say to turn on billing, instead of suggesting a retry that cannot succeed.

### Documentation
- Corrected docs to describe development-only hosted generation, the 403 production gate, the full `bun run test` command and the legacy status of the Python TTB prototype; added pointers to `library/`.
- Added this changelog and a manual release procedure.

### Licensing
- Relicensed the project from MIT to the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later). Copies obtained earlier keep their MIT terms.

## 0.2.0 (current repository version, not a published release)

### Added
- Two independent SvelteKit 3 and Bun interfaces for Vocal Fix reference intake and TTB Studio song configuration.
- Shared UI and request contracts, with explicit integration boundaries for future authentication, database and billing.
- Docker-free Linux deployment instructions and separate systemd examples for each app.
- CI checks for both frontend builds, TypeScript checks, shared contract tests and Python endpoint tests; a committed Bun lockfile.

### Changed
- Public-facing development now uses the SvelteKit apps; the Python APIs remain private local prototypes.
- Production audio upload and generation bridges reject requests until authentication and tenant controls are implemented.

### Fixed
- SvelteKit TypeScript configuration and Python test discovery.

### Limits
- The root workspace version is 0.2.0; individual apps and shared packages remain at 0.1.0.
- Real generation, vocal separation, Premium Studio processing, authentication, payments and database persistence are not implemented.

## 0.1.0 (initial scaffold, not a published release)

### Added
- Independent local Python apps for Vocal Fix and TTB Studio, browser surfaces and starter API tests.
- Five-recording reference intake with rights acknowledgment, metadata retrieval and session deletion.
- Song configuration and sound-character contracts, with explicit unavailable responses instead of fabricated generated audio.
- Architecture, roadmap and recording-rights documentation.
