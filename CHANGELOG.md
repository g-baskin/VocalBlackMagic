# Changelog

This log describes repository changes, not verified public releases. No release tags or GitHub releases existed when it was introduced. See [Release procedure](docs/RELEASING.md).

## Unreleased

### Added
- TTB Studio hosted song generation through fal (ACE-Step) and Google Lyria 3.5, with job status polling, audio format verification and in-browser playback. Development only; keys come from `FAL_KEY` and `GEMINI_API_KEY`.

### Fixed
- Lyria requests from a Google project without billing now say to turn on billing, instead of suggesting a retry that cannot succeed.

### Documentation
- Added this changelog and a manual release procedure.

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
