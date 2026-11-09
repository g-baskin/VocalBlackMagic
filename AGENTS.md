# Coding-agent handoff — Vocal Black Magic

Read `README.md`, `docs/SAAS_STACK.md`, `docs/ROADMAP.md`, `docs/RIGHTS_AND_SAFETY.md` before modifying the repo.

Deeper project knowledge lives in `library/`: knowledge docs under `library/knowledge/private/{architecture,security,auth}`, Draft contracts under `library/knowledge/private/contracts`, backlog PRDs under `library/requirements/backlog`, and the wiki and code graph under `library/knowledge/private/wiki` (`codegraph.md`; regenerate with `python3.12 library/knowledge/private/wiki/tools/build_codegraph.py`).

## Non-negotiable boundaries
- Preserve **two independent apps**: `apps/vocal-fix` and `apps/ttb-studio`. Each uses Svelte 5 + SvelteKit 3 + Bun; no Docker runtime requirement.
- TTB Studio is a **modular monolith**. Python model inference can be an out-of-process GPU worker. Do not invent a microservice per feature.
- Preserve original raw source audio and create versioned derived mixes.
- Premium Studio is an **opt-in**, non-destructive processing mode separate from sound character.
- Never claim integration with a third-party V2 engine unless actual authenticated API documentation and licensing are verified.
- Process voices only with affirmative artist/speaker authorization and recording rights. Uploading five tracks is not consent to recreate any recognizable third-party identity.
- Never expose current unauthenticated local Python prototypes publicly; implement real authenticated, tenant-scoped access and storage controls first.
- Do not fake job completion or fabricated waveforms; explicit 503/501 is preferable to a false success.

## First tasks, in sequence
1. Build authenticated identity/organization/session layer with secure ownership checks and private object storage. Use contracts in `packages/auth`, `packages/database`, `packages/billing`, replacing stubs only when integrated.
2. Extract Python APIs to a stable audio-worker job interface with asynchronous job status, cancellation, idempotency and GPU limits. Keep workers private.
3. Implement FFmpeg media probe, true audio validation and Demucs vocal separation. Add quality gates and source preservation.
4. Implement Gold Vocal curation as attributable clean representative segments, not waveform averaging; descriptive prompt generation. Gate identity conditioning on verified rights.
5. Replace the hosted fal ACE-Step adapter with a licensed self-hosted adapter if required; build optional Premium Studio effects on derived copies.
6. Add alternate models, verified external V2 integration, comparisons and arrangement editor.

Production-ready means **all** of: licensed model, verified output, user auth, tenant scopes, private asset access, recording consent audit trail, provider billing protections, GPU cost controls, and passing CI.

<!-- gg:init:start -->
## Implemented state
Everything below runs in development only (`NODE_ENV === 'development'`), with no authentication, tenancy, spend cap or rate limit. Outside development every processing, studio and generation route returns 403. Data lives on local disk under `VBM_DATA_DIR` or `<repo>/data` (the nearest folder holding `bun.lock`).

- **Vocal Fix** (`apps/vocal-fix/src/lib/server/`) runs its own pipeline in SvelteKit (ADR 0004); Python is not needed. Intake takes one take (`fix`) or exactly five (`forge`), a performer name and a rights attestation; each file is ffprobe-probed and fully decoded before `integrity_verified: true`, with sha256. It diagnoses, repairs (local ffmpeg presets; optional Demucs and resemble-enhance on Replicate), assembles a Gold Vocal from ranked phrases, and trains an RVC voice on Replicate after a typed-name own-voice consent. Results are new versioned files under `data/vocal-fix/sessions/<id>/`; originals are never rewritten. Forged voices go to `data/shared/voices/`.
- **TTB Studio** (`apps/ttb-studio/src/lib/server/studio/`) keeps a file-backed song library at `data/studio/songs/<id>/` (audio plus `meta.json`). Songs come from legacy engine ids (Replicate MiniMax 1.5 default, ACE-Step, Stable Audio 2.5, Lyria 2; fal ACE-Step 1.5; Lyria 3.5) or the models x runners router (self-hosted engine, then provider API, then Replicate). It also does lyrics (Anthropic, OpenAI, Gemini, then Replicate Claude), stems, reimagine, local ffmpeg master, RVC voice, voice summon from the shared registry, extend/repaint/cover edits, FLUX cover art and the Séance blind comparison.
- **Beats** (`apps/ttb-studio/src/routes/beats`, `src/lib/client/beats/`, contracts in `packages/contracts/src/beats.ts`) is a browser step sequencer, piano roll, playlist and mixer with a 3-osc synth, a drum synth and a sampler that plays Pads sounds (ADR 0005). Audio is plain Web Audio: a lookahead scheduler (25 ms timer, 120 ms horizon on the audio clock) for playback, and the same voices and mixer on an `OfflineAudioContext` for WAV export. Computer keys and Web MIDI play and record the selected channel; `.mid` files import and export via `@tonejs/midi`. Projects are validated JSON at `data/studio/beats/<uuid>.json` via `BeatStore` and `/api/studio/beats` (behind `guard()`); limits are 32 channels, 99 patterns, 20,000 notes and 512 clips. No paid calls.
- **Audio engine** (`services/audio-engine`) is a self-hosted FastAPI music engine (protocol v1, `docs/ENGINE_PROTOCOL.md`) for ACE-Step 1.5, HeartMuLa, DiffRhythm 2 and YuE2. It needs `VBM_ENGINE_TOKEN` to start. CI tests it only with a fake sine-wave backend; no real model run is verified in CI. `modal_app.py` is not deployed.
- Keys live in each app's git-ignored `.env`: Vocal Fix `REPLICATE_API_TOKEN`; TTB Studio `REPLICATE_API_TOKEN`, `FAL_KEY`, `GEMINI_API_KEY`, `MINIMAX_API_KEY`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `VBM_ENGINE_URL`, `VBM_ENGINE_TOKEN` (declared in each app's `src/env.ts`). A missing key answers 503.
- `packages/auth`, `database` and `billing` are contracts, not integrated services; nothing imports them. `assertAuthenticated` checks a supplied object; it does not establish a verified session. Consent records are self-attested names and checkboxes, not verified identity.

## Integration traps
- Non-development routes intentionally return 403. Production systemd units trigger this guard; changing NODE_ENV to bypass it does not supply authentication.
- API routes also refuse a Host header other than localhost, 127.0.0.1 or [::1] (Vocal Fix via `hooks.server.ts`, TTB via `guard()` in `studio/context.ts`). Legacy `/api/generations` and `/api/studio/capabilities` in TTB have no Host check. Reaching the dev server by LAN IP gets 403.
- Writes need `application/json` or the `x-vbm-intent` header (415 otherwise) so cross-site forms cannot spend credit.
- Every paid action costs money per request (Replicate, fal, Google, MiniMax, ElevenLabs, Anthropic, OpenAI, or GPU time). TTB refuses new paid work while 3 jobs are `running` (4 for Séance takes); synchronous runners are not counted while in flight. Vocal Fix runs at most 2 jobs (1 forge) and queues the rest. These are local guards, not billing protection.
- Router fallback happens only when a runner refused before a job existed (`RunnerRefused`); any other error is rethrown so nothing is paid twice.
- Jobs persist as JSON (`data/studio/jobs/`, `data/vocal-fix/jobs/`, engine `VBM_ENGINE_DATA/jobs/`). Vocal Fix and engine jobs cut off by a restart are reported failed, never resumed. TTB jobs have no restart handling: they advance only when `GET /api/studio/jobs/<id>` is polled, so a closed tab leaves the paid provider job running, its audio is stored on a later poll (even after a restart), and after 20 minutes the job is cancelled and marked failed.
- Audio is format-sniffed and size-bounded before storage; Vocal Fix input is decoded. A Séance take hides its model until ranking (`studio/seal.ts`).
- The Python apps are legacy: `apps/vocal_fix` intake returns 501 for processing and stores `integrity_verified: false`; `apps/ttb_studio` generation returns 503 and rejects `lyria-3.5` and `duration_seconds`. Neither SvelteKit UI calls them; the TTB page no longer calls `/api/generations` either. `packages/contracts` validators are authoritative. Health endpoints report process health, not model readiness, except engine `/v1/health`, which reports per-model readiness.
- `VFM_DATA_DIR` (Python) defaults relative to the Python process working directory; `VBM_DATA_DIR` (SvelteKit) resolves to the repo root. Different variables, different stores.
- ffmpeg lookup differs: Vocal Fix uses `VBM_FFMPEG` / `VBM_FFPROBE`, TTB master uses `FFMPEG_PATH`; both fall back to PATH then `/usr/local/bin`. `bun run test` needs ffmpeg.
- The engine Docker image binds `0.0.0.0`, which turns the engine's Host check off; only the bearer token then protects it. `VBM_ENGINE_URL` accepts plain `http:`, so the token travels in clear to a remote engine.
- CI runs `bun install`, not `bun install --frozen-lockfile`, so lockfile drift is not caught. Mocked provider tests do not show a provider works; see the README's Verification status.
- Sister-app URLs use build-time `VITE_VOCAL_FIX_URL` / `VITE_TTB_STUDIO_URL`; Python backend URLs use runtime `VOCAL_FIX_API_URL` / `TTB_STUDIO_API_URL`. Changing runtime environment alone will not repair links in an existing frontend build.
- Keep the SvelteKit 3 `$app/tsconfig` inheritance and adapter configuration in Vite; the earlier `.svelte-kit/tsconfig.json` template was corrected in commit `4f1d435`.
- Python tests need their own environment (CI uses Python 3.11 for `apps`/`tests`, 3.12 for `services/audio-engine`), independently of Bun dependencies. Run `python -m pytest -q` from the repository root and separately inside `services/audio-engine`. These are contract tests, not GPU or browser tests.
<!-- gg:init:end -->
