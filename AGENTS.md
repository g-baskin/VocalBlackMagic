# Coding-agent handoff — Vocal Black Magic

Read `README.md`, `docs/SAAS_STACK.md`, `docs/ROADMAP.md`, `docs/RIGHTS_AND_SAFETY.md` before modifying the repo.

## Non-negotiable boundaries
- Preserve **two independent apps**: `apps/vocal-fix` and `apps/ttb-studio`. Each uses Svelte 5 + SvelteKit 3 + Node.js; no Docker runtime requirement.
- TTB Studio is a **modular monolith**. Python model inference can be an out-of-process GPU worker. Do not invent a microservice per feature.
- Preserve original raw source audio and create versioned derived mixes.
- Premium Studio is an **opt-in**, non-destructive processing mode separate from sound character.
- Never claim integration with a third-party V2 engine unless actual authenticated API documentation and licensing are verified.
- Process voices only with affirmative artist/speaker authorization and recording rights. Uploading five tracks is not consent to recreate any recognizable third-party identity.
- Never expose current unauthenticated local Python prototypes publicly; implement real authenticated, tenant-scoped access and storage controls first.
- Do not fake job completion or fabricated waveforms; explicit 503/501 is preferable to a false success.

## First tasks, in sequence
2. Build authenticated identity/organization/session layer with secure ownership checks and private object storage. Use contracts in `packages/auth`, `packages/database`, `packages/billing`, replacing stubs only when integrated.
3. Extract Python APIs to a stable audio-worker job interface with asynchronous job status, cancellation, idempotency and GPU limits. Keep workers private.
4. Implement FFmpeg media probe, true audio validation and Demucs vocal separation. Add quality gates and source preservation.
5. Implement Gold Vocal curation as attributable clean representative segments, not waveform averaging; descriptive prompt generation. Gate identity conditioning on verified rights.
6. Add ACE-Step generation adapter and actual verified media output; build optional Premium Studio effects on derived copies.
7. Add alternate models, verified external V2 integration, comparisons and arrangement editor.

Production-ready means **all** of: licensed model, verified output, user auth, tenant scopes, private asset access, recording consent audit trail, provider billing protections, GPU cost controls, and passing CI.

<!-- gg:init:start -->
## Implemented state
Vocal Black Magic currently stores authorized vocal references and offers a music-request editor; it does not process vocals or generate songs.

- Hyphenated app directories are SvelteKit/Node.js frontends; underscored Python directories own local filesystem intake and unconfigured generation endpoints. Docker Compose runs only the Python prototypes, not the frontends.
- `packages/auth`, `database` and `billing` are contracts, not integrated services. `assertAuthenticated` checks a supplied object; it does not establish a verified session.

## Integration traps
- Non-development Svelte reference and generation routes intentionally return 403. Production systemd units trigger this guard; changing NODE_ENV to bypass it does not supply authentication.
- Successful upload means extension/size validation, not decoded audio validation: manifests retain `integrity_verified: false`. Python tests use synthetic bytes, so they cannot establish media quality.
- Python processing returns 501 and generation returns 503 even for valid requests. Health endpoints report process health, not model readiness.
- Python and TypeScript independently define generation validation. Python supplies defaults, but the Svelte bridge requires explicit numeric controls, premium boolean and null-or-string lyrics. Direct Python endpoint tests do not exercise that bridge.
- `VFM_DATA_DIR` defaults relative to the Python process working directory. Changing cwd without an explicit data path makes existing sessions appear missing.
- Sister-app URLs use build-time `VITE_VOCAL_FIX_URL` / `VITE_TTB_STUDIO_URL`; Python backend URLs use runtime `VOCAL_FIX_API_URL` / `TTB_STUDIO_API_URL`. Changing runtime environment alone will not repair links in an existing frontend build.
- Keep the SvelteKit 3 `$app/tsconfig` inheritance and adapter configuration in Vite; the earlier `.svelte-kit/tsconfig.json` template was corrected in commit `4f1d435`.
- Python tests need their own environment (CI uses Python 3.11), independently of npm dependencies. `pytest.ini` supplies root imports; run `python -m pytest -q` from the repository root. These are contract tests, not GPU or browser tests.
<!-- gg:init:end -->
