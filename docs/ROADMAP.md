# Roadmap and implementation acceptance criteria

## Phase 0 — Repo foundation (this initial commit)
- [x] Public GitHub monorepo, README, license (AGPL-3.0-or-later; MIT before November 2026), docs, ignore rules.
- [x] Two separately runnable FastAPI apps and independent browser surfaces.
- [x] Five-file upload/consent contract and request validation; no model inference simulation.
- [x] Presets, Premium Studio toggle and generation contract.
- [x] Starter automated endpoint tests.
- [x] GitHub Actions workflows added for Svelte/Bun and Python. CI status must be verified; a workflow file alone is not evidence of passing tests.

## Phase 1 — Vocal Fix pipeline
- [ ] FFmpeg transcode and media probe with upload-size/duration/codec enforcement. Partial (development only): SvelteKit Vocal Fix probes and fully decodes each upload with ffprobe/ffmpeg, enforcing 100 MB, 600 s and a codec allow-list.
- [ ] Demucs separation with isolated queue, resource/timeout limits, clean vocals and source preservation. Partial (development only): optional hosted Demucs on Replicate in a persisted job queue (2 running, 1 forge); originals are never rewritten.
- [ ] VAD + ranking + editable Gold Vocal segment assembly; listening preview. Partial (development only): phrases are ranked and joined into a Gold Vocal WAV with a JSON of source timestamps.
- [ ] Voice-profile generation using observable vocal characteristics; no unverified artist identity claims. Partial (development only): a descriptive profile of observable traits is written with the Gold Vocal.
- [ ] Versioned WAV/FLAC exports, detailed quality report, asset deletion.
- **Gate:** five authorized inputs produce reproducible attributable Gold Vocal, with no silent failures or nonconsensual identity inference.

## Phase 2 — TTB generation MVP
- [ ] ACE-Step adapter, version pin, health probe, license check and real WAV output. Partial: development-only hosted adapters (fal `fal-ai/ace-step-1.5`, Replicate pinned versions) return format-verified audio. A self-hosted engine (`services/audio-engine`) reports per-model readiness and licence in `/v1/health`; it is tested in CI only with a fake backend, so real self-hosted output is unverified.
- [ ] Full-song, instrumental and custom-lyrics flows with asynchronous progress and cancel/retry. Partial: studio jobs report staged progress by polling and can be canceled (Replicate and engine tasks are canceled upstream); retry is manual.
- [ ] Save projects, generation settings, variants and artifacts. Partial (development only): a file-backed song library stores audio, settings, runner record and derived versions with `parent_id`; no projects or database.
- [ ] Character-presets renderer; optional Premium Studio **derived** mastering.
- **Gate:** real generated audio, validated duration, audible A/B difference, original source unchanged.

## Phase 3 — Better-than-clean listening workflow
- [ ] HeartMuLa provider adapter and verified external V2 integration (if API and commercial terms permit). Partial: HeartMuLa runs through Replicate or the self-hosted engine in the studio router; external V2 is not integrated.
- [ ] Four-generation comparison, blind listening panel and structured preference capture. Partial: the Séance compares 2 to 4 models blind for one listener and keeps a ranking leaderboard; no multi-listener panel.
- [ ] Prompt optimization from preference feedback; seed and style replication only when provider supports.
- [ ] Stems, section regenerate, extend, remix, waveform timeline, pattern editor, MIDI export with actual conversion. Partial: stems (Demucs), repaint, extend, cover/restyle and reimagine exist in development; timeline, pattern editor and MIDI do not.
- **Gate:** reproducible preference benchmark on 20+ varied prompts and multiple listeners.

## Phase 4 — Production readiness
- [ ] User auth, secure tenancy, Postgres, object store, private signed URLs and rate limits.
- [ ] Audit/provenance/consent, deletion, model license registry, cost caps, payment plan design if monetized.
- [ ] GPU deployment, CI/CD, dependency scans, data retention policy and observability.
- **Gate:** security review and consent verification prior to public uploads.

## Tests required
- Exactly five uploads; reject missing/extra/empty/oversize/unsupported assets.
- Reject unacknowledged rights; prevent traversal and cross-session reads.
- Verify delete actually removes originals.
- Unsupported engine/model returns explicit error; no fake waveform or placeholder 'success'.
- Premium Studio never overwrites dry audio; idempotent pipeline retries and job cancellation.
- Performance/load tests with long tracks and simultaneous uploads.

## Phase 0B — SaaS migration (SvelteKit 3 / Bun)
- [x] Two independent SvelteKit 3 app surfaces in Bun workspaces.
- [x] Shared UI, contracts and placeholder auth/database/billing contracts.
- [x] Vocal Fix proxy to local Python (now legacy; the pipeline runs in SvelteKit per ADR 0004); fail-closed production upload and generation.
- [x] Docker-free systemd reference units and architecture documentation.
- [x] Verify passing SvelteKit 3 TypeScript checks, production builds and Python tests in CI.
- [ ] `bun.lock` is committed; switch CI to frozen-lockfile installs (CI still runs plain `bun install`).
- [ ] Integrate an auth provider; secure production session checks and per-tenant access.
- [ ] Stripe checkout and signed webhooks, entitlements, idempotent credits ledger.
- [ ] PostgreSQL migrations, S3-compatible private audio storage, queue and GPU worker.
- **Gate:** do not enable production vocal uploads or generation before the security and cost-accounting checklist is complete.
