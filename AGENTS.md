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
Vocal Black Magic currently stores authorized vocal references and offers a music-request editor. In development only (`NODE_ENV === 'development'`), TTB Studio generates songs through hosted providers (fal ACE-Step 1.5, Google Lyria 3.5), with Gemini 3.5 Flash-Lite writing lyrics for ACE-Step complete songs that have none. There is no authentication, spend cap or rate limit; in production every generation route returns 403. Keys `FAL_KEY` and `GEMINI_API_KEY` live in `apps/ttb-studio/.env` (git-ignored). fal audio is format-verified and streamed; Lyria audio is format-verified and returned inline as base64 JSON. Nothing is stored. It does not process vocals.

- Hyphenated app directories are SvelteKit/Bun frontends; underscored Python directories own local filesystem intake and unconfigured generation endpoints. Docker Compose runs only the Python prototypes, not the frontends.
- `packages/auth`, `database` and `billing` are contracts, not integrated services. `assertAuthenticated` checks a supplied object; it does not establish a verified session.

## Integration traps
- Non-development Svelte reference and generation routes intentionally return 403. Production systemd units trigger this guard; changing NODE_ENV to bypass it does not supply authentication.
- Successful upload means extension/size validation, not decoded audio validation: manifests retain `integrity_verified: false`. Python tests use synthetic bytes, so they cannot establish media quality.
- Python processing returns 501 and the legacy Python generation endpoint returns 503 even for valid requests. Health endpoints report process health, not model readiness.
- TTB Studio generation no longer bridges to Python: SvelteKit calls fal and Lyria directly (`apps/ttb-studio/src/lib/server/music/`), and keys are declared in `apps/ttb-studio/src/env.ts` for `$app/env/private`. The Python `ttb_studio` generation endpoint is a legacy prototype, unused by the SvelteKit app, and does not accept `lyria-3.5` or `duration_seconds`; `packages/contracts` `validateGenerationRequest` is the authoritative validator. `apps/ttb-studio/src/lib/server/backend.ts` and `TTB_STUDIO_API_URL` are unused.
- Generation is paid per request. HeartMuLa and External V2 return 501; a missing key returns 503.
- `VFM_DATA_DIR` defaults relative to the Python process working directory. Changing cwd without an explicit data path makes existing sessions appear missing.
- Sister-app URLs use build-time `VITE_VOCAL_FIX_URL` / `VITE_TTB_STUDIO_URL`; Python backend URLs use runtime `VOCAL_FIX_API_URL` / `TTB_STUDIO_API_URL`. Changing runtime environment alone will not repair links in an existing frontend build.
- Keep the SvelteKit 3 `$app/tsconfig` inheritance and adapter configuration in Vite; the earlier `.svelte-kit/tsconfig.json` template was corrected in commit `4f1d435`.
- Python tests need their own environment (CI uses Python 3.11), independently of Bun dependencies. `pytest.ini` supplies root imports; run `python -m pytest -q` from the repository root. These are contract tests, not GPU or browser tests.
<!-- gg:init:end -->
