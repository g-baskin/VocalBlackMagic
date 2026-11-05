# Roadmap and implementation acceptance criteria

## Phase 0 — Repo foundation (this initial commit)
- [x] Public GitHub monorepo, README, MIT license, docs, ignore rules.
- [x] Two separately runnable FastAPI apps and independent browser surfaces.
- [x] Five-file upload/consent contract and request validation; no model inference simulation.
- [x] Presets, Premium Studio toggle and generation contract.
- [x] Starter automated endpoint tests.
- [ ] CI validation in GitHub Actions (add after framework works).

## Phase 1 — Vocal Fix pipeline
- [ ] FFmpeg transcode and media probe with upload-size/duration/codec enforcement.
- [ ] Demucs separation with isolated queue, resource/timeout limits, clean vocals and source preservation.
- [ ] VAD + ranking + editable Gold Vocal segment assembly; listening preview.
- [ ] Voice-profile generation using observable vocal characteristics; no unverified artist identity claims.
- [ ] Versioned WAV/FLAC exports, detailed quality report, asset deletion.
- **Gate:** five authorized inputs produce reproducible attributable Gold Vocal, with no silent failures or nonconsensual identity inference.

## Phase 2 — TTB generation MVP
- [ ] ACE-Step adapter, version pin, health probe, license check and real WAV output.
- [ ] Full-song, instrumental and custom-lyrics flows with asynchronous progress and cancel/retry.
- [ ] Save projects, generation settings, variants and artifacts.
- [ ] Character-presets renderer; optional Premium Studio **derived** mastering.
- **Gate:** real generated audio, validated duration, audible A/B difference, original source unchanged.

## Phase 3 — Better-than-clean listening workflow
- [ ] HeartMuLa provider adapter and verified external V2 integration (if API and commercial terms permit).
- [ ] Four-generation comparison, blind listening panel and structured preference capture.
- [ ] Prompt optimization from preference feedback; seed and style replication only when provider supports.
- [ ] Stems, section regenerate, extend, remix, waveform timeline, pattern editor, MIDI export with actual conversion.
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
