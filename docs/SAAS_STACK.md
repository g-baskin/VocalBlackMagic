# SaaS migration — SvelteKit 3 + Bun (Docker optional)

## Status and version choice (2026-11-05)
- Svelte 5 + SvelteKit 3 and official `@sveltejs/adapter-bun`.
- Bun >= 1.4. Build with `bun run build` (it builds each app), serve with `bun ./build`.
- Two SvelteKit apps: `apps/vocal-fix` (port 5173 dev / 3001 prod) and `apps/ttb-studio` (5174 / 3002).
- Shared workspaces: `@vbm/ui`, `@vbm/contracts`, `@vbm/auth`, `@vbm/database`, `@vbm/billing`.
- Legacy Python FastAPI entrypoints in `apps/vocal_fix` and `apps/ttb_studio` are retained for localhost-only audio prototypes (ports 8001/8002); neither UI calls them. `services/audio-engine` is a separate, optional self-hosted music engine (protocol v1) that TTB Studio can call; it is a private worker, **not** a second SaaS.
- Nothing in this scaffold constitutes working authentication, payments, spend caps or public-safe vocal upload. Vocal processing and song generation are development-only. Self-hosted inference exists in `services/audio-engine` but CI exercises it only with a fake backend.

## Local development without Docker
```bash
git clone https://github.com/g-baskin/VocalBlackMagic.git
cd VocalBlackMagic
bun install --frozen-lockfile
bun run dev:vocal             # http://localhost:5173
# in a second terminal
bun run dev:ttb               # http://localhost:5174
```
Neither app depends on Python: both pipelines run in the SvelteKit servers. Vocal Fix needs `ffmpeg`/`ffprobe` and, for hosted stages, `REPLICATE_API_TOKEN` in `apps/vocal-fix/.env`. TTB Studio needs at least one provider key or a self-hosted engine in `apps/ttb-studio/.env` (see the README). The legacy Python prototypes, unused by either UI, still run with:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn apps.vocal_fix.app:app --host 127.0.0.1 --port 8001
# optional legacy TTB prototype, unused by apps/ttb-studio:
uvicorn apps.ttb_studio.app:app --host 127.0.0.1 --port 8002
```
Production upload, processing and generation routes intentionally return 403 until tenant authentication and asset authorization are implemented. Python services have no SaaS authentication; **never expose them directly**.

## Build and serve on Linux (no containers)
```bash
bun install --frozen-lockfile
bun run check
bun run build
cd apps/vocal-fix
HOST=127.0.0.1 PORT=3001 bun ./build
# other shell:
cd apps/ttb-studio
HOST=127.0.0.1 PORT=3002 bun ./build
```
Use the sample systemd units in `infra/systemd` (edit directories, users, ports and Bun executable location). Use a reverse proxy with TLS to publish *only after* authentication and tenancy are complete. No Docker daemon is required.

## Cost/resource model
- SvelteKit server: commodity CPU/RAM, independent of GPU inference.
- Python audio engine (`services/audio-engine`): runs on a GPU host (or CPU for smoke tests) with a bearer token; a CUDA Dockerfile and an undeployed Modal app are provided.
- PostgreSQL for tenancy, credits, metadata and idempotent job state; S3-compatible private object store for original and derived audio (neither is wired yet; today songs, sessions, jobs and voices are JSON and audio files on local disk).
- Queue/job leasing may be implemented using a Postgres table first; Redis is optional after measuring job volume.
- Audio outputs immutable, derived mastering versioned, worker temp files removed per retention policy.

## Security/reliability backlog before public launch
1. Integrate OIDC or comparable secure auth, paid entitlements, tenant-scoped access controls and server-only secrets.
2. Signed upload flow directly into private object storage with size, codec and malware checks.
3. Async job leasing, retries/cancel, quota ceilings, GPU concurrency, cost per render and failure telemetry.
4. Stripe webhooks with signature verification, idempotent credit ledger and refund/retry handling.
5. Consented vocal-reference processing with identity-policy controls, reference deletion and consent revocation.
6. Security headers, rate limits, CSRF protection, logs/analytics without raw audio, and staging threat-model review.
7. `bun.lock` is committed, but CI still runs plain `bun install`; switch CI to `bun install --frozen-lockfile`.

## Sources
- Official SvelteKit Bun adapter: https://svelte.dev/docs/kit/adapter-bun
- SvelteKit v3 migration: https://svelte.dev/docs/kit/migrating-to-sveltekit-3
- Bun workspaces: https://bun.com/docs/pm/workspaces
