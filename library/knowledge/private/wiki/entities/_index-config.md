---
type: meta
title: "Entities index: environment, services, tests and packaging"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
related: []
sources: []
---

# Entities index: environment, services, tests and packaging

320 entity pages at `b58d4574`, split across three index pages:

- [[entities/_index]]: modules
- [[entities/_index-interfaces]]: contracts, UI, routes and endpoints
- [[entities/_index-config]]: environment, services, tests and packaging

## Environment variables (43)

- [[entities/env-acestep-src]]: Clone target for the ACE-Step install script.
- [[entities/env-anthropic-api-key]]: Anthropic key for the first lyricist in the chain.
- [[entities/env-auth-client-id]]: Planned production variable listed under "Future production integrations (none configured or active)".
- [[entities/env-auth-client-secret]]: Planned production variable listed under "Future production integrations (none configured or active)".
- [[entities/env-auth-issuer-url]]: Planned production variable listed under "Future production integrations (none configured or active)".
- [[entities/env-cuda-visible-devices]]: GPU visibility for the DiffRhythm subprocess.
- [[entities/env-database-url]]: Planned production variable listed under "Future production integrations (none configured or active)".
- [[entities/env-elevenlabs-api-key]]: ElevenLabs key for direct music generation.
- [[entities/env-fal-key]]: fal.ai API key for ACE-Step generation and ACE-Step v1 edits.
- [[entities/env-ffmpeg-path]]: Explicit ffmpeg path for TTB Studio mastering; a different name from Vocal Fix's `VBM_FFMPEG`.
- [[entities/env-gemini-api-key]]: Google Gemini key for Lyria 3.5, Lyria 3 Pro and the Gemini lyricist.
- [[entities/env-hf-home]]: Hugging Face home directory.
- [[entities/env-hf-hub-cache]]: Hub cache path set for the DiffRhythm subprocess so inference reuses downloaded weights.
- [[entities/env-host]]: Bind address set by both systemd units.
- [[entities/env-minimax-api-key]]: MiniMax key for direct Music 2.6 generation.
- [[entities/env-node-env]]: Only `development` enables hosted generation and Vocal Fix reference uploads.
- [[entities/env-object-storage-endpoint]]: Planned production variable listed under "Future production integrations (none configured or active)".
- [[entities/env-openai-api-key]]: OpenAI key for the lyricist fallback.
- [[entities/env-port]]: Port set by both systemd units: TTB Studio 3002, Vocal Fix 3001.
- [[entities/env-replicate-api-token]]: Replicate token for studio engines, lyrics, stems and voice in TTB Studio, and for Demucs, resemble-enhance and RVC in Vocal Fix.
- [[entities/env-stripe-secret-key]]: Planned production variable listed under "Future production integrations (none configured or active)".
- [[entities/env-stripe-webhook-secret]]: Planned production variable listed under "Future production integrations (none configured or active)".
- [[entities/env-torch-index]]: PyTorch wheel index used by the install script and Docker build.
- [[entities/env-ttb-studio-api-url]]: Legacy URL of the Python TTB Studio prototype; `.env.example` says only unused legacy code reads it.
- [[entities/env-vbm-acestep-lm-backend]]: ACE-Step LM backend passed to upstream `LLMHandler.initialize`.
- [[entities/env-vbm-data-dir]]: Where the studio library and shared voice registry live, for both SvelteKit apps.
- [[entities/env-vbm-engine-allow-cpu]]: Opt-in for slow CPU runs; without it CPU backends report not ready.
- [[entities/env-vbm-engine-cache]]: Engine setting read by `Settings.from_env`.
- [[entities/env-vbm-engine-concurrency]]: Engine setting read by `Settings.from_env`.
- [[entities/env-vbm-engine-data]]: Engine setting read by `Settings.from_env`.
- [[entities/env-vbm-engine-device]]: Forces the engine device.
- [[entities/env-vbm-engine-max-queue]]: Engine setting read by `Settings.from_env`.
- [[entities/env-vbm-engine-token]]: Shared bearer token: the engine requires it to start and on every non-health route; TTB Studio sends it.
- [[entities/env-vbm-engine-url]]: Base URL of a self-hosted VBM engine for TTB Studio.
- [[entities/env-vbm-ffmpeg]]: Explicit ffmpeg path for Vocal Fix media work.
- [[entities/env-vbm-ffprobe]]: Explicit ffprobe path for Vocal Fix media work.
- [[entities/env-vbm-modal-backend]]: Modal deploy setting read at module import on the deploying machine.
- [[entities/env-vbm-modal-gpu]]: Modal deploy setting read at module import on the deploying machine.
- [[entities/env-vbm-modal-scaledown]]: Modal deploy setting read at module import on the deploying machine.
- [[entities/env-vfm-data-dir]]: Data root of the Python Vocal Fix prototype.
- [[entities/env-vite-ttb-studio-url]]: Build-time link from Vocal Fix to TTB Studio.
- [[entities/env-vite-vocal-fix-url]]: Build-time link from TTB Studio to Vocal Fix.
- [[entities/env-vocal-fix-api-url]]: Runtime URL of the private Python Vocal Fix API that the SvelteKit reference routes proxy to.

## External services (18)

- [[entities/ext-ai-google-dev]]: Provider documentation host cited in code comments; no request is made to it (grep shows it only inside comments).
- [[entities/ext-api-anthropic-com]]: Anthropic Messages API, first lyricist.
- [[entities/ext-api-elevenlabs-io]]: ElevenLabs music API.
- [[entities/ext-api-minimax-io]]: MiniMax music generation.
- [[entities/ext-api-openai-com]]: OpenAI Chat Completions, lyricist fallback.
- [[entities/ext-api-replicate-com]]: Replicate predictions and files API used by both apps.
- [[entities/ext-docs-anthropic-com]]: Provider documentation host cited in code comments; no request is made to it (grep shows it only inside comments).
- [[entities/ext-download-pytorch-org]]: CUDA 12.8 PyTorch wheel index.
- [[entities/ext-elevenlabs-io]]: Provider documentation host cited in code comments; no request is made to it (grep shows it only inside comments).
- [[entities/ext-fal-ai]]: Provider documentation host cited in code comments; no request is made to it (grep shows it only inside comments).
- [[entities/ext-fonts-googleapis-com]]: Google Fonts stylesheet imported by Vocal Fix.
- [[entities/ext-generativelanguage-googleapis-com]]: Google Gemini API host for Lyria music and Gemini lyricists.
- [[entities/ext-github-com]]: Source host for pinned upstream model code.
- [[entities/ext-huggingface-co]]: Model weight host reached through `huggingface_hub.snapshot_download`; the hostname is the library default and does not appear in repo source (unverified).
- [[entities/ext-platform-minimax-io]]: Provider documentation host cited in code comments; no request is made to it (grep shows it only inside comments).
- [[entities/ext-platform-openai-com]]: Provider documentation host cited in code comments; no request is made to it (grep shows it only inside comments).
- [[entities/ext-queue-fal-run]]: fal.ai queue host for ACE-Step 1.5 jobs and ACE-Step v1 edit endpoints.
- [[entities/ext-replicate-delivery]]: Replicate's output file host.

## Test suites (24)

- [[entities/test-contracts]]: Bun tests for `validateGenerationRequest` and sound characters.
- [[entities/test-contracts-engine]]: Runs every case of the shared fixture `packages/contracts/fixtures/engine-requests.json` through `validateEngineJobRequest`.
- [[entities/test-engine-backends]]: Tests for the real backends without their heavy dependencies.
- [[entities/test-engine-fixtures]]: Shared pytest fixtures and a test-only backend that writes a real sine WAV; the fake is not registered in production.
- [[entities/test-engine-protocol]]: pytest suite driving the FastAPI app with the fake backend through `TestClient`.
- [[entities/test-engine-validation-parity]]: Runs every case of `packages/contracts/fixtures/engine-requests.json` through the Python validator.
- [[entities/test-lyrics]]: Bun tests for automatic lyrics, ACE-Step limits and Lyria lyric prompts.
- [[entities/test-music]]: Bun tests for audio verification, fal and Lyria adapters, capabilities and the request gate.
- [[entities/test-python-apps]]: Pytest HTTP contract tests for both FastAPI prototypes using synthetic bytes, no GPU.
- [[entities/test-studio-capabilities]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-direct]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-edit]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-engine]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-lyrics]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-review]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-router]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-seal]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-seance]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-studio-studio]]: Bun test file for the studio server; providers are mocked, never run live.
- [[entities/test-ttb-client-seance-time]]: Bun tests for séance timing, including a regression where every take used the longest take's length.
- [[entities/test-ui-audio]]: Bun tests for mod-ui-audio.
- [[entities/test-ui-mermaid-doc]]: Bun tests for mod-ui-mermaid-doc.
- [[entities/test-ui-region]]: Bun tests for mod-ui-region.
- [[entities/test-vf-server]]: Bun test suite for the Vocal Fix server modules.

## Engine packaging (stubs) (9)

- [[entities/engine-dockerfile]]: engine-dockerfile
- [[entities/engine-install-ace-step]]: engine-install-ace-step
- [[entities/engine-pyproject]]: engine-pyproject
- [[entities/engine-requirements-ace-step]]: engine-requirements-ace-step
- [[entities/engine-requirements-base]]: engine-requirements-base
- [[entities/engine-requirements-dev]]: engine-requirements-dev
- [[entities/engine-requirements-diffrhythm2]]: engine-requirements-diffrhythm2
- [[entities/engine-requirements-heartmula]]: engine-requirements-heartmula
- [[entities/engine-requirements-yue2]]: engine-requirements-yue2
