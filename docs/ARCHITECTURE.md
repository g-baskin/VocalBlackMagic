# Technical architecture

```text
VocalBlackMagic/
  apps/
    vocal_fix/        # independent FastAPI ASGI app + browser UI
    ttb_studio/        # independent FastAPI ASGI app + browser UI
  docs/                # requirements, architecture, workflows and gates
  tests/               # executable API contract tests
```

## Initial runnable scaffold
- Python 3.11+ with FastAPI, Pydantic, Uvicorn.
- Separate entrypoints: `apps.vocal_fix.app:app` and `apps.ttb_studio.app:app`.
- Vocal Fix supports five-file ingestion, metadata and deletion with local disk storage. Processing endpoint is explicitly **not implemented**.
- TTB Studio exposes preset/engine capability catalog and validates generation requests, then explicitly rejects generation until an engine adapter is installed. It does **not** pretend to generate music.
- Local-only starter: no authentication or hardened tenancy yet. **Do not expose to public traffic** before security phase.

## Target modular-monolith architecture (TTB)
- Modules inside one deployable API: projects, prompt planner, model-adapter registry, inference orchestration, mix and mastering, preview, exports, preferences and audit.
- Dependency inversion: generic `GenerationRequest/GenerationResult` contract; engine adapters implement supported modes, limits, costs, metadata and failure semantics.
- Heavy inference allowed as separate GPU **process/job worker**; this does not require separate product services. API is the orchestration monolith.
- Persistent job state and user data: PostgreSQL, object store (filesystem for local dev, S3-compatible production), Redis optional for queue, event/state machine with retries and idempotent job IDs.
- Audio processing: FFmpeg ingest/encode; optional Demucs/Roop? **Demucs only** for source separation; Silero VAD and audio inspection; Pedalboard/FFmpeg effects for mastering; loudness and peak QC. All optional until implemented.
- Separate permissions and storage scopes for two apps; no implicit cross-product transfer of user voice data.

## Data entities
- User, Project, Track, GenerationJob, ModelRun, PromptVersion, SoundPreset, AudioAsset, StemAsset, MixVersion, ExportJob.
- VocalReferenceSession, ReferenceRecording (5), VocalSegment, GoldVocal, VocalProfile, VoiceAuthorization, VoiceDeletionRequest, AssetProvenance.
- Store engine/version/parameters/seed and input hashes; do not store secrets in projects.

## Interface contracts
- Vocal Fix: GET /api/health; POST /api/references (5 files + consent + owner name); GET/DELETE /api/references/{id}; POST /api/references/{id}/process (501 until implemented).
- TTB Studio: GET /api/health; GET /api/capabilities; POST /api/generations (503 until provider configured).
- Health, readiness, config/version endpoints before deploying.
- Structured job errors: unsupported mode, unlicensed provider, invalid reference, insufficient GPU, quality gate failed, cancellation, timeout and retry exhausted.

## Security/operations gates before internet deployment
- OIDC/OAuth, ownership checks on every asset/job, signed expiring audio URLs, max duration/size and rate limits, private object storage, encryption, logs without raw audio or lyrics, upload malware scanning and content-type validation, CSRF/CORS protections.
- Performer-consent evidence, voice identity restriction policies, source retention rules, delete/export endpoints, audit log, abuse reporting.
- Observability with metrics, tracing and errors; avoid leaking voice assets or lyrics to analytics providers.
- CI tests, dependencies/license scan, secret detection, tagged releases, reproducible model revisions, GPU quota and cancellation.
