# Vocal Black Magic

![Vocal Black Magic: from a raw voice to a finished song](docs/assets/banner.png)

**Two apps, one purpose: help artists turn their own voice into original music.**

Vocal Fix is the reference-intake side; TTB Studio is the song-planning side. The goal is an authorized vocal-to-song workflow that preserves the performance rather than replacing its character.

> **Prototype, not a working generation platform.** Local reference upload and deletion work with the Python backend. In local development only, TTB Studio can generate songs through hosted providers (fal ACE-Step 1.5, Google Lyria 3.5) when API keys are set. Vocal cleanup, Gold Vocal assembly, voice conditioning and Premium Studio processing are not implemented. Authentication, tenant storage and billing are also pending.

| Product | Location | Developer URL |
| --- | --- | --- |
| Vocal Fix | [apps/vocal-fix](apps/vocal-fix) | http://localhost:5173 |
| TTB Studio | [apps/ttb-studio](apps/ttb-studio) | http://localhost:5174 |

## What each app does

- **Vocal Fix** (development only, no authentication): two modes, *Fix a take* (one recording) and *Forge a Gold Vocal* (exactly five). Intake requires a performer name and rights attestation; each file is probed and fully decoded with ffmpeg before `integrity_verified` is set. It then diagnoses loudness, clipping, noise and silence with timestamps, and repairs takes as staged, cancellable jobs: optional Demucs vocal isolation and resemble-enhance on Replicate (paid, `REPLICATE_API_TOKEN` in `apps/vocal-fix/.env`), then a local ffmpeg polish preset (Natural, Radio Presence, Ethereal Air, Raw Grit), with before/after scores and A/B playback. The local polish adapts denoise and a between-phrase gate to the measured noise floor and caps make-up gain at +12 dB. If noise, clipping or overall drops by more than 5 points, it retries once with a stronger setting. If the score is still worse, the result says so (for example: try AI enhance) instead of hiding it. At most 2 jobs run at once (1 forge); the rest queue. Job status is saved under `data/vocal-fix/jobs/`, and jobs cut off by a restart are reported as failed. API routes answer only to localhost, 127.0.0.1 or [::1] Host headers (DNS-rebinding guard). Forge mode ranks phrases across the five repaired takes and joins the best ones with silence into a Gold Vocal WAV plus a JSON of source timestamps, along with a descriptive profile of observable traits only. *Voice Forge* trains an RVC voice on Replicate only after the performer types their own name and confirms it is their voice; the result is registered in `data/shared/voices/` for TTB Studio and can be revoked. Originals are never modified; every result is a new versioned file under `data/vocal-fix/sessions/`. It was tested end to end with an AI-generated synthetic voice, not a real singer.
- **TTB Studio:** a song studio for local development only. Every studio route returns 403 unless `NODE_ENV=development` and answers only to a localhost Host header; there is no authentication. With `REPLICATE_API_TOKEN` it creates songs with MiniMax Music 1.5 (default), ACE-Step, Stable Audio 2.5 or Lyria 2 on Replicate, in Simple mode (a description; lyrics by Claude 3.5 Haiku, falling back to Claude 4.5 Haiku when that fails) or Custom mode (title, tagged lyrics, style tags, instrumental, 1 or 2 takes). fal ACE-Step 1.5 and Google Lyria 3.5 still work when `FAL_KEY` / `GEMINI_API_KEY` are set. Each new song can get FLUX Schnell cover art (optional, about $0.003); derived songs inherit their parent's cover. Finished audio and covers are format-checked and stored with `meta.json` under `data/studio/songs/<id>/` (or `VBM_DATA_DIR`). From the library a song can be split into stems (Demucs) and played in a stem mixer, reimagined (MiniMax Music-01), given a local ffmpeg Studio Master (-14 LUFS, -1 dBTP; original kept, A/B in the player), or sung in a voice from the shared registry. In Custom mode a song can also be summoned directly in a forged voice: MiniMax Music-01 takes a 30 s excerpt of that voice's Gold Vocal plus a music reference from the library. Only voices that are `ready` with own-voice consent are offered, and the voice id and consent session are recorded in the song's metadata. A lyrics workshop writes, rewrites and extends lyrics. Paid actions cost a few cents each on Replicate; at most 3 paid jobs may run at once.
- **How they connect:** Vocal Fix writes forged voices to the shared registry in `data/shared/voices/`; TTB Studio reads it and offers only `ready` voices with own-voice consent. Both apps share the `packages/ui` design system and `packages/contracts` types. There is still no authentication, so this connection is for local development only.

## Run locally without Docker

Requires [Bun 1.4+](https://bun.com/) and **no container runtime**.

```bash
git clone https://github.com/g-baskin/VocalBlackMagic.git
cd VocalBlackMagic
bun install --frozen-lockfile

# Terminal A: Vocal Fix
bun run dev:vocal

# Terminal B: TTB Studio
bun run dev:ttb
```

The SvelteKit user interfaces run independently even when the Python audio services are offline. TTB Studio does not need Python: put `FAL_KEY` and/or `GEMINI_API_KEY` in `apps/ttb-studio/.env` (git-ignored; see `.env.example`). To enable **local development only** of Vocal Fix reference upload and capability discovery, use Python 3.11+ (the example uses 3.11):

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Terminal C
uvicorn apps.vocal_fix.app:app --host 127.0.0.1 --port 8001

# Optional, legacy prototype not used by TTB Studio (same activated environment)
uvicorn apps.ttb_studio.app:app --host 127.0.0.1 --port 8002
```

**Security warning:** the original Python prototypes have no account authentication. The SvelteKit apps block uploads and generation in production until real user authentication, tenant isolation and billing are implemented. Do not expose the Python ports directly.

## If the default ports are occupied

Use these instead of the default dev commands, one per terminal from the repository root. The URL overrides keep the sister-app links aligned with the new ports; `--strictPort` prevents silent fallback to another port.

```bash
(cd apps/vocal-fix && VITE_TTB_STUDIO_URL=http://127.0.0.1:5414 bun run dev --port 5413 --strictPort)
(cd apps/ttb-studio && VITE_VOCAL_FIX_URL=http://127.0.0.1:5413 bun run dev --port 5414 --strictPort)
```

Open http://127.0.0.1:5413 and http://127.0.0.1:5414. If those ports are already in use, choose another pair and update both URL overrides. Do not stop another project's server to free a port.

**What each app needs** (development only):

- `ffmpeg` and `ffprobe` (Vocal Fix looks in `/usr/local/bin`; override with `VBM_FFMPEG` / `VBM_FFPROBE`).
- `apps/vocal-fix/.env` with `REPLICATE_API_TOKEN=...` for the paid hosted stages (Demucs, resemble-enhance, RVC training). Without it, intake, diagnosis, local repair and Gold Vocal still work, and hosted stages answer 503.
- `apps/ttb-studio/.env` with `REPLICATE_API_TOKEN=...`; `FAL_KEY` and `GEMINI_API_KEY` are optional.
- `VITE_TTB_STUDIO_URL` / `VITE_VOCAL_FIX_URL` (as in the commands above) so the sister-app links point at 5414 / 5413. They are read at build or dev start.

Both `.env` files are git-ignored. Sessions, test material, songs and the shared voice registry live in `data/` at the repository root (or `VBM_DATA_DIR`). `data/` is git-ignored and must never be committed.

## Build and test

For lint, formatting and strict Python typing, activate the Python environment
and install `pip install -r requirements-dev.txt` in addition to `bun install --frozen-lockfile`.
Run `bun run lint`, `bun run format:check` and `bun run check:python`.
`bun run format` applies the formatters; check commands do not rewrite source.
TypeScript/Svelte checks remain `bun run check`. Python checks cover both APIs and tests.

```bash
bun run test
bun run check
bun run build
python -m pytest -q
```

On a Linux host, run each production build with Bun and manage it with systemd (sample units in [infra/systemd](infra/systemd)). See [SaaS stack and deployment](docs/SAAS_STACK.md). Docker is optional legacy convenience only; not required by the new applications.

> **Current functional limits:** This is a SaaS UI and API-boundary scaffold, not a production-ready music platform. Vocal source upload is available only in local development; Gold Vocal separation, voice conditioning, local model inference, Premium Studio DSP, payments, database persistence and public user authentication are not implemented; hosted song generation is development-only. Never represent a request as generated audio without a verified model result.

## Architecture and contributing

The two Svelte 5 + SvelteKit 3 apps build independently in a Bun workspace. TTB remains a modular monolith. Shared packages hold contracts and UI; auth, database and billing packages are interfaces rather than working integrations. Python APIs are local prototypes, with GPU inference planned separately.

Before contributing, read the [agent handoff](AGENTS.md) and the relevant specification below. Keep implemented behavior distinct from planned capabilities, and preserve the two independent apps.


- [SaaS stack and Docker-free deployment](docs/SAAS_STACK.md)
- [Changelog](CHANGELOG.md)
- [Release procedure](docs/RELEASING.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design diagrams](docs/DESIGN.md) (Mermaid; also shown in each app at `/arcana`)
- [Shared vocabulary](docs/GLOSSARY.md)
- [Architecture decision log](docs/decisions/README.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Audio models and Gold Vocal pipeline](docs/MODELS_AND_AUDIO.md)
- [Rights, authorization and privacy](docs/RIGHTS_AND_SAFETY.md)
- [Agent implementation handoff](AGENTS.md)
- [Project library](library/README.md): knowledge docs in `library/knowledge/private/` (`architecture`, `security`, `auth`), Draft contracts in `library/knowledge/private/contracts`, backlog PRDs in `library/requirements/backlog`, and a wiki and code graph in `library/knowledge/private/wiki` (`codegraph.md`; regenerate with `python3.12 library/knowledge/private/wiki/tools/build_codegraph.py`)

## Licensing and vocal rights

Copyright (C) 2026 Vocal Black Magic Contributors. Original application code is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later). If you run a modified version as a network service, the AGPL requires you to offer its users the corresponding source code. Copies obtained before this change remain available under the MIT terms they were published with. Individual models, weights, datasets, licensed samples, proprietary V2 APIs and commercial outputs are governed by independent terms. A publicly accessible recording does **not** authorize imitation of the vocalist. Vocal reference processing requires the performer's permission and appropriate recording rights.
