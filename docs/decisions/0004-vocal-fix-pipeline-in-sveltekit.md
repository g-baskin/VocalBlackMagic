# 0004. Run the Vocal Fix pipeline in the SvelteKit server

Recorded: 2026-11-06

## Status

Accepted. Refines [0003](0003-runtime-boundary.md) for Vocal Fix only; the Python prototype remains as a legacy reference.

## Context

Vocal Fix needed real intake validation, diagnosis, repair, Gold Vocal assembly and voice training. The Python prototype answered 501 for processing, and TTB Studio had already moved its hosted generation into SvelteKit.

## Decision

The Vocal Fix SvelteKit (Bun) server owns the pipeline:

- Local DSP and analysis run with `ffmpeg`/`ffprobe`, spawned with argument arrays (never a shell), timeouts and size/duration limits (100 MB, 10 minutes).
- GPU inference is hosted on Replicate: `ryan5453/demucs` (vocal isolation), `resemble-ai/resemble-enhance` (denoise and enhance) and `replicate/train-rvc-model` (voice training). Each version is pinned in code.
- Sessions live on local disk under `VBM_DATA_DIR` or `<repo>/data`. Originals are immutable; every result is a new versioned derived file with sha256 and provenance in `manifest.json`.
- Trained voices are written to a shared registry, `<data>/shared/voices/<id>.json` (`VoiceModel` in `packages/contracts`), which TTB Studio reads.

All processing routes answer 403 unless `NODE_ENV === 'development'`. State-changing requests must be JSON or carry an `x-vbm-intent` header, so cross-site forms cannot spend credit.

## Consequences

Vocal Fix works without starting Python. Hosted stages cost money per request and send audio to Replicate. There is still no authentication, tenancy, spend cap or rate limit, so none of this may be exposed publicly. Jobs run in-process and do not survive a server restart; a restarted job reports failure.

## Alternatives

A private Python GPU worker (0003) remains the long-term option for self-hosted models. Running Demucs and RVC locally would avoid per-request cost but needs a GPU and model weights that are not set up here.
