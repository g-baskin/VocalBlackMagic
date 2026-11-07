# Technical architecture

```text
VocalBlackMagic/
  apps/
    vocal_fix/        # independent FastAPI ASGI app + browser UI
    ttb_studio/        # independent FastAPI ASGI app + browser UI
    vocal-fix/ ttb-studio/  # SvelteKit 3 + Bun apps (see runtime boundary below)
  packages/ services/ infra/  # shared contracts and UI, self-hosted audio engine, systemd units
  docs/                # requirements, architecture, workflows and gates
  tests/               # executable API contract tests
```

## Initial runnable scaffold
- Python 3.11+ with FastAPI, Pydantic, Uvicorn.
- Separate entrypoints: `apps.vocal_fix.app:app` and `apps.ttb_studio.app:app`.
- The legacy Python Vocal Fix supports five-file ingestion, metadata and deletion with local disk storage; its processing endpoint is **not implemented**. The SvelteKit Vocal Fix app now runs the real pipeline itself (see [ADR 0004](decisions/0004-vocal-fix-pipeline-in-sveltekit.md)).
- The legacy Python TTB Studio exposes a preset/engine capability catalog and validates generation requests, then explicitly rejects generation. It does **not** pretend to generate music, and the SvelteKit app does not call it. `packages/contracts` `validateGenerationRequest` is the authoritative request validator; the Python model is legacy.
- Local-only starter: no authentication or hardened tenancy yet. **Do not expose to public traffic** before security phase.

## Target modular-monolith architecture (TTB)
- Modules inside one deployable API: projects, prompt planner, model-adapter registry, inference orchestration, mix and mastering, preview, exports, preferences and audit.
- Dependency inversion: generic `GenerationRequest/GenerationResult` contract; engine adapters implement supported modes, limits, costs, metadata and failure semantics.
- Heavy inference allowed as separate GPU **process/job worker**; this does not require separate product services. API is the orchestration monolith.
- Persistent job state and user data: PostgreSQL, object store (filesystem for local dev, S3-compatible production), Redis optional for queue, event/state machine with retries and idempotent job IDs.
- Audio processing: FFmpeg ingest/encode; optional Demucs/Roop? **Demucs only** for source separation; Silero VAD and audio inspection; Pedalboard/FFmpeg effects for mastering; loudness and peak QC. All optional until implemented.
- Separate permissions and storage scopes for two apps; no implicit cross-product transfer of user voice data.

## Data entities

Canonical terms and planned-to-code mappings are in the [shared glossary](GLOSSARY.md).
Decision context and trade-offs are in the [decision log](decisions/README.md).

- User, Project, Track, GenerationJob, ModelRun, PromptVersion, SoundPreset, AudioAsset, StemAsset, MixVersion, ExportJob.
- VocalReferenceSession, ReferenceRecording (5), VocalSegment, GoldVocal, VocalProfile, VoiceAuthorization, VoiceDeletionRequest, AssetProvenance.
- Store engine/version/parameters/seed and input hashes; do not store secrets in projects.

## Interface contracts
- Vocal Fix (SvelteKit, used by the UI): GET /api/health; GET /api/capabilities; POST /api/sessions (multipart, mode `fix` with 1 file or `forge` with 5, performer, rights attestation); GET/DELETE /api/sessions/{id}; POST /api/sessions/{id}/diagnose, /repair, /gold, /forge; GET/DELETE /api/sessions/{id}/jobs/{job}; GET /api/sessions/{id}/audio/{area}/{file}; GET /api/voices; DELETE /api/voices/{voice_id}. All except health and capabilities return 403 outside development; every /api route refuses a non-localhost Host header.
- Vocal Fix (legacy, proxied to Python, unused by the UI): POST /api/references (5 files + consent + owner name); GET/DELETE /api/references/{id}; Python POST /api/references/{id}/process returns 501.
- TTB Studio (used by the UI): GET /api/studio/capabilities; GET/POST /api/studio/songs; GET/PATCH/DELETE /api/studio/songs/{id}; GET /api/studio/songs/{id}/audio; GET/POST /api/studio/songs/{id}/cover; GET/POST /api/studio/songs/{id}/edit; POST /api/studio/songs/{id}/master, /reimagine, /stems, /voice; GET/DELETE /api/studio/jobs/{id}; POST /api/studio/lyrics; GET /api/studio/voices; GET/POST /api/studio/seances; GET /api/studio/seances/{id}; POST /api/studio/seances/{id}/rank; GET /api/studio/seances/leaderboard. All except capabilities are dev-only (403) and localhost-only; writes need JSON (415).
- TTB Studio (legacy, unused by the UI): GET /api/health; GET /api/capabilities; POST /api/generations (development only: 202 queued fal job, 200 completed Lyria job with inline audio, 503 missing key, 501 other engines, 415/422 bad requests; 403 outside development); GET /api/generations/{id} and GET /api/generations/{id}/audio, both also 403 outside development.
- Self-hosted engine (`services/audio-engine`): protocol v1 in [ENGINE_PROTOCOL.md](ENGINE_PROTOCOL.md).
- Health, readiness, config/version endpoints before deploying.
- Structured job errors: unsupported mode, unlicensed provider, invalid reference, insufficient GPU, quality gate failed, cancellation, timeout and retry exhausted.

## Security/operations gates before internet deployment
- OIDC/OAuth, ownership checks on every asset/job, signed expiring audio URLs, max duration/size and rate limits, private object storage, encryption, logs without raw audio or lyrics, upload malware scanning and content-type validation, CSRF/CORS protections.
- Performer-consent evidence, voice identity restriction policies, source retention rules, delete/export endpoints, audit log, abuse reporting.
- Observability with metrics, tracing and errors; avoid leaking voice assets or lyrics to analytics providers.
- CI tests, dependencies/license scan, secret detection, tagged releases, reproducible model revisions, GPU quota and cancellation.

## Updated runtime boundary — SaaS migration
The earlier FastAPI app entrypoints above are **retained audio prototypes**, not the user-facing web apps. The new SaaS layer is:

```text
apps/vocal-fix/             SvelteKit 3 + Bun UI + dev-only pipeline (ffmpeg DSP, Replicate inference)
apps/ttb-studio/             SvelteKit 3 + Bun modular monolith UI with dev-only provider adapters (Replicate, fal, Google, MiniMax, ElevenLabs, Anthropic, OpenAI), a models x runners router and a local song library
apps/vocal_fix/              legacy Python local reference-ingestion backend
apps/ttb_studio/             legacy Python local generation-contract backend (unused by apps/ttb-studio)
packages/{ui,contracts}/    shared arcane design system, audio graphs and typed API contracts (including engine protocol v1)
packages/{auth,database,billing}/   explicit future integration boundaries
services/audio-engine/      optional self-hosted Python music engine (FastAPI, bearer token, protocol v1); tested in CI with a fake backend only
infra/systemd/              sample no-Docker system services
```

The Vocal Fix and TTB Studio processing and generation routes permit calls only during local development. Production upload and generation are denied pending user authentication, tenant ownership, private blob storage and billing safeguards. See `docs/SAAS_STACK.md` for the recommended deployment.
