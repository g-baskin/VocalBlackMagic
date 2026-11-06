# Coding-agent handoff — Vocal Black Magic

Read `README.md`, `docs/SAAS_STACK.md`, `docs/ROADMAP.md`, `docs/RIGHTS_AND_SAFETY.md` before modifying the repo.

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
1. Run `bun install && bun run check && bun test packages && bun run build`, plus `python -m pytest -q`; repair CI before feature work. Commit generated `bun.lock` after verified install, then use frozen installs.
2. Build authenticated identity/organization/session layer with secure ownership checks and private object storage. Use contracts in `packages/auth`, `packages/database`, `packages/billing`, replacing stubs only when integrated.
3. Extract Python APIs to a stable audio-worker job interface with asynchronous job status, cancellation, idempotency and GPU limits. Keep workers private.
4. Implement FFmpeg media probe, true audio validation and Demucs vocal separation. Add quality gates and source preservation.
5. Implement Gold Vocal curation as attributable clean representative segments, not waveform averaging; descriptive prompt generation. Gate identity conditioning on verified rights.
6. Add ACE-Step generation adapter and actual verified media output; build optional Premium Studio effects on derived copies.
7. Add alternate models, verified external V2 integration, comparisons and arrangement editor.

## Developer commands
```bash
bun install
bun run dev:vocal          # localhost:5173
bun run dev:ttb            # localhost:5174
bun run check
bun test packages
bun run build
python -m pytest -q
```

Production-ready means **all** of: licensed model, verified output, user auth, tenant scopes, private asset access, recording consent audit trail, provider billing protections, GPU cost controls, and passing CI.
