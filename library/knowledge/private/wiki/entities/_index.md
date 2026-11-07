---
type: meta
title: "Entities index: modules"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
related: []
sources: []
---

# Entities index: modules

320 entity pages at `b58d4574`, split across three index pages:

- [[entities/_index]]: modules
- [[entities/_index-interfaces]]: contracts, UI, routes and endpoints
- [[entities/_index-config]]: environment, services, tests and packaging

## Modules: TTB Studio studio server (24)

- [[entities/mod-studio-context]]: Builds the dependency bundle every studio route uses and the shared request guard (dev gate, localhost-only host check, JSON content type).
- [[entities/mod-studio-cover]]: Generates, verifies and stores square cover art for library songs via Replicate `black-forest-labs/flux-schnell`, and copies covers onto derived songs.
- [[entities/mod-studio-create]]: The single entry point for new original songs: picks a voice summon, a routed model, Lyria 3.5, fal ACE-Step or a Replicate engine, writes lyrics when needed...
- [[entities/mod-studio-derive]]: Starts derived works from a library song.
- [[entities/mod-studio-edit]]: Suno-style edits of a library song on ACE-Step, routed engine first, then fal ACE-Step v1 edit endpoints.
- [[entities/mod-studio-engines]]: The original studio engine list (before the models x runners router), Replicate model pins, derived-work prices and request checks for engine-based creates.
- [[entities/mod-studio-gold]]: Finds the newest Gold Vocal WAV produced by Vocal Fix for a voice's consent session, strictly inside the data dir.
- [[entities/mod-studio-jobs]]: Persists studio jobs under `<data>/studio/jobs/<id>.json`, polls Replicate, fal and the engine, stores verified audio as library songs, and enforces spend ca...
- [[entities/mod-studio-library]]: The on-disk song library: one folder per song id under `<data>/studio/songs/<id>/` with `meta.json`, audio, stems and cover.
- [[entities/mod-studio-lyrics]]: Writes, rewrites or extends lyrics with a direct provider chain (Anthropic, OpenAI, Gemini) and a Replicate Claude fallback.
- [[entities/mod-studio-master]]: Local ffmpeg processing: a two-pass loudness master to a new 24-bit WAV, plus 30 s MP3 reference excerpts for models.
- [[entities/mod-studio-paths]]: Resolves the studio data directory and decides whether a Host header names the local machine.
- [[entities/mod-studio-range]]: Serves stored audio and cover files with single-range HTTP Range support.
- [[entities/mod-studio-replicate]]: Minimal Replicate API client: predictions, cancel, file upload, safe output download and capped body reads.
- [[entities/mod-studio-runner-capabilities]]: Lists every model with each runner's live status and licence badge.
- [[entities/mod-studio-runner-direct]]: Synchronous direct-provider adapters.
- [[entities/mod-studio-runner-engine]]: HTTP client for the self-hosted VBM audio engine, plus the `RunnerRefused` error that marks a safe-to-fall-back refusal.
- [[entities/mod-studio-runner-models]]: The catalogue of seven models and, per model, its runners in preference order: self-hosted engine, provider API, then Replicate.
- [[entities/mod-studio-runner-routed]]: Submits takes for a chosen model through the router and returns queued tasks or synchronous audio plus a runner record.
- [[entities/mod-studio-runner-router]]: Decides which runner takes a model and falls back only when nothing was created, so a job is never paid for twice.
- [[entities/mod-studio-seal]]: Strips everything that would identify a seance take's model from library song metadata until that seance is revealed.
- [[entities/mod-studio-seance]]: The Seance: one take per model on the same prompt and lyrics, labelled A to D in shuffled order, with model and runner hidden until the user ranks the takes.
- [[entities/mod-studio-voices]]: Reads the shared Voice Forge registry and filters it to voices the studio may sing with.
- [[entities/mod-studio-voicesummon]]: Builds MiniMax Music-01 takes conditioned on a consented voice's Gold Vocal and an instrumental reference.

## Modules: TTB Studio music adapters (9)

- [[entities/mod-music-audio]]: Verifies that provider output is real audio by magic-byte sniffing and size limits before it reaches the browser.
- [[entities/mod-music-capabilities]]: Builds the legacy `TTBCapabilities` report.
- [[entities/mod-music-errors]]: Defines `ProviderError`, which carries an HTTP status, a public message and an optional log-only detail, and `errorResponse`, which converts any thrown value...
- [[entities/mod-music-fal]]: Adapter for ACE-Step 1.5 on the fal queue API at `https://queue.fal.run` with default app `fal-ai/ace-step-1.5`.
- [[entities/mod-music-gate]]: Server helpers that decide whether hosted generation may run and whether a request may spend credit.
- [[entities/mod-music-jobs]]: Encodes and decodes the public `job_id` string that names a provider job.
- [[entities/mod-music-lyria]]: Adapter for Google Lyria through the Interactions API.
- [[entities/mod-music-lyricist]]: Writes lyrics with `gemini-3.5-flash-lite` when an ACE-Step full song has none.
- [[entities/mod-music-prompt]]: Builds provider-neutral text from a `GenerationRequest`.

## Modules: TTB Studio app and client (6)

- [[entities/mod-ttb-client-api]]: JSON fetch wrapper plus audio and cover URL builders for the studio API.
- [[entities/mod-ttb-client-jobs]]: Client job follower and a 16-bit PCM WAV encoder.
- [[entities/mod-ttb-client-seance-time]]: Pure timing helpers for the séance player.
- [[entities/mod-ttb-studio-backend]]: A loopback bridge helper to the Python TTB Studio prototype, reading `TTB_STUDIO_API_URL`.
- [[entities/mod-ttb-studio-env]]: Declares TTB Studio private environment variables through `defineEnvVars`.
- [[entities/mod-ttb-studio-python-app]]: FastAPI scaffold whose docstring states no generative model is installed or invoked.

## Modules: Vocal Fix (19)

- [[entities/mod-vf-chain]]: Local ffmpeg polish definitions and the never-worse comparison.
- [[entities/mod-vf-client]]: Browser fetch wrapper that satisfies the mutation guard.
- [[entities/mod-vf-context]]: Process-wide service holder.
- [[entities/mod-vf-diagnose]]: Measures loudness, noise, clipping and silence of a take.
- [[entities/mod-vf-env]]: SvelteKit environment schema for Vocal Fix.
- [[entities/mod-vf-errors]]: Typed error and JSON error mapper.
- [[entities/mod-vf-forge]]: Own-voice consent gate and shared voice registry.
- [[entities/mod-vf-gate]]: Request gates shared by every Vocal Fix API route.
- [[entities/mod-vf-gold]]: Gold Vocal curation primitives.
- [[entities/mod-vf-hooks-server]]: Server hook applying the DNS-rebinding guard to API routes.
- [[entities/mod-vf-jobs]]: In-process async job queue with on-disk status.
- [[entities/mod-vf-media]]: Local media probing, verification and processing via subprocesses.
- [[entities/mod-vf-paths]]: Resolves where sessions, jobs and voices are stored.
- [[entities/mod-vf-profile]]: Describes the Gold Vocal for the registry and prompts.
- [[entities/mod-vf-range]]: Serves stored audio with HTTP range support.
- [[entities/mod-vf-replicate]]: Hosted inference client used for paid stages.
- [[entities/mod-vf-service]]: Orchestrates intake, diagnosis, repair, Gold Vocal and voice forge.
- [[entities/mod-vf-storage]]: File-system session store with path containment checks.
- [[entities/mod-vf-svc]]: Route-facing accessor for the service.

## Modules: Vocal Fix legacy (2)

- [[entities/mod-vocal-fix-backend]]: Loopback bridge to the private Python prototype.
- [[entities/mod-vocal-fix-python-app]]: Local-only FastAPI prototype that accepts and groups five reference recordings; its docstring states it performs no separation, synthesis, cloning or Gold Vo...

## Modules: shared contracts (4)

- [[entities/mod-contracts]]: Package entry point for `@vbm/contracts`.
- [[entities/mod-contracts-engine]]: TypeScript side of the HTTP contract between TTB Studio and the self-hosted engine in `services/audio-engine`; the header says the Python worker mirrors thes...
- [[entities/mod-contracts-studio]]: Contracts for the TTB Studio song library: engines and models, songs, jobs, lyrics, the Séance blind comparison and Suno-style edits.
- [[entities/mod-contracts-voice]]: Voice registry entry at `<data dir>/shared/voices/<id>.json`, written by Vocal Fix and read by TTB Studio.

## Modules: shared UI (6)

- [[entities/mod-ui-audio]]: Real audio analysis helpers, pure except the AudioContext used for decoding.
- [[entities/mod-ui-audio-graph]]: One AudioContext plus MediaElementSource per media element, since `createMediaElementSource` may run only once.
- [[entities/mod-ui-canvas]]: Shared canvas plumbing.
- [[entities/mod-ui-mermaid-doc]]: Extracts mermaid blocks from markdown, exported as `@vbm/ui/mermaid-doc`.
- [[entities/mod-ui-region]]: Pure helpers for RegionSelect, exported as `@vbm/ui/region`.
- [[entities/mod-ui-theme]]: Global arcane design tokens and base styles, exported as `@vbm/ui/theme.css`.

## Modules: audio engine (16)

- [[entities/mod-engine-app]]: FastAPI application implementing the five protocol v1 routes, bearer auth, the localhost Host guard, request limits and the uniform `{detail, code}` error sh...
- [[entities/mod-engine-audio]]: Decodes a backend's output file with libsndfile and measures it, so the engine never trusts a backend's claimed duration.
- [[entities/mod-engine-backend-ace-step]]: ACE-Step 1.5 (MIT) backend using the upstream Python API at a pinned commit; supports all four tasks, with extend done as repaint over padded silence.
- [[entities/mod-engine-backend-base]]: Plugin interface every model backend implements; heavy dependencies must be imported lazily.
- [[entities/mod-engine-backend-common]]: Readiness checks shared by HeartMuLa, DiffRhythm 2 and YuE2.
- [[entities/mod-engine-backend-diffrhythm]]: DiffRhythm 2 (Apache-2.0) backend that runs the upstream `inference.py` as a subprocess; text2music only.
- [[entities/mod-engine-backend-heartmula]]: HeartMuLa backend via `heartlib` (Apache-2.0) at a pinned commit; text2music only, up to 240 s.
- [[entities/mod-engine-backend-init]]: Registry of the four production backends; test backends cannot be selected through configuration.
- [[entities/mod-engine-backend-yue2]]: YuE2-3B backend whose weights are CC BY-NC 4.0, reported as `commercial: False`; CUDA only, text2music only.
- [[entities/mod-engine-device]]: Chooses `cuda`, then `mps`, then `cpu`, with torch optional, and reports CUDA device 0 memory.
- [[entities/mod-engine-download]]: CLI `python -m vbm_engine.download <model>` that downloads a model's weights into `VBM_ENGINE_CACHE` after a free-disk check.
- [[entities/mod-engine-init]]: Package marker declaring the engine protocol and package version.
- [[entities/mod-engine-jobs]]: In-process job queue with fixed worker threads (GPU slots), idempotency keys, cooperative cancellation and atomic on-disk JSON records under `VBM_ENGINE_DATA...
- [[entities/mod-engine-main]]: CLI entry point `python -m vbm_engine [--host] [--port]` that refuses to start without a token and decides whether the localhost Host guard applies.
- [[entities/mod-engine-modal-app]]: Modal serverless-GPU wrapper for the engine; its docstring states it is NOT DEPLOYED and that running its commands spends money.
- [[entities/mod-engine-validation]]: Python mirror of `validateEngineJobRequest` in `packages/contracts/src/engine.ts`; messages must stay identical and a shared fixture checks both.

## Modules: SaaS packages (contracts only) (3)

- [[entities/mod-auth]]: Authorization contract only; the header comment states that no identity provider is integrated.
- [[entities/mod-billing]]: Planning interfaces only; the header comment states no payments or balances are processed.
- [[entities/mod-database]]: Future persistence contracts; the header comment states no database connection is initialized.
