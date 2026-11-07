# Vocal Black Magic

![Vocal Black Magic: from a raw voice to a finished song](docs/assets/banner.png)

**Two apps, one purpose: help artists turn their own voice into original music.**

Vocal Fix is the reference-intake side; TTB Studio is the song-planning side. The goal is an authorized vocal-to-song workflow that preserves the performance rather than replacing its character.

> **Prototype for local development only.** Both apps run their pipelines inside the SvelteKit servers, only when `NODE_ENV=development`. Vocal Fix diagnoses and repairs takes, assembles a Gold Vocal and can train a consented voice; TTB Studio generates, stores and edits songs through hosted providers or an optional self-hosted engine (`services/audio-engine`) when keys are set. Premium Studio processing is not implemented. Authentication, tenant storage, spend caps and billing are pending.

| Product | Location | Developer URL |
| --- | --- | --- |
| Vocal Fix | [apps/vocal-fix](apps/vocal-fix) | http://localhost:5173 |
| TTB Studio | [apps/ttb-studio](apps/ttb-studio) | http://localhost:5174 |

## What each app does

- **Vocal Fix** (development only, no authentication): two modes, *Fix a take* (one recording) and *Forge a Gold Vocal* (exactly five). Intake requires a performer name and rights attestation; each file is probed and fully decoded with ffmpeg before `integrity_verified` is set. It then diagnoses loudness, clipping, noise and silence with timestamps, and repairs takes as staged, cancellable jobs: optional Demucs vocal isolation and resemble-enhance on Replicate (paid, `REPLICATE_API_TOKEN` in `apps/vocal-fix/.env`), then a local ffmpeg polish preset (Natural, Radio Presence, Ethereal Air, Raw Grit), with before/after scores and A/B playback. The local polish adapts denoise and a between-phrase gate to the measured noise floor and caps make-up gain at +12 dB. If noise, clipping or overall drops by more than 5 points, it retries once with a stronger setting. If the score is still worse, the result says so (for example: try AI enhance) instead of hiding it. At most 2 jobs run at once (1 forge); the rest queue. Job status is saved under `data/vocal-fix/jobs/`, and jobs cut off by a restart are reported as failed. API routes answer only to localhost, 127.0.0.1 or [::1] Host headers (DNS-rebinding guard). Forge mode ranks phrases across the five repaired takes and joins the best ones with silence into a Gold Vocal WAV plus a JSON of source timestamps, along with a descriptive profile of observable traits only. *Voice Forge* trains an RVC voice on Replicate only after the performer types their own name and confirms it is their voice; the result is registered in `data/shared/voices/` for TTB Studio and can be revoked. Originals are never modified; every result is a new versioned file under `data/vocal-fix/sessions/`. It was tested end to end with an AI-generated synthetic voice, not a real singer.
- **TTB Studio:** a song studio for local development only. Every `/api/studio/*` route except `capabilities` returns 403 unless `NODE_ENV=development` and refuses Host headers other than localhost; there is no authentication. The model picker offers two kinds of choice. Legacy engines: MiniMax Music 1.5 (default), ACE-Step, Stable Audio 2.5 or Lyria 2 on Replicate, fal ACE-Step 1.5 (`FAL_KEY`) and Google Lyria 3.5 (`GEMINI_API_KEY`). Routed models: ACE-Step 1.5, HeartMuLa, DiffRhythm, YuE, MiniMax Music 2.6, Lyria 3 Pro and ElevenLabs Music, each run by the first ready runner in order: the self-hosted engine (`VBM_ENGINE_URL` + `VBM_ENGINE_TOKEN`), the provider's own API (`MINIMAX_API_KEY`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `FAL_KEY`), then Replicate. A runner is skipped only when it refused before any job existed, so a song is never paid for twice. Songs are made in Simple mode (a description; lyrics written by Anthropic, OpenAI or Gemini, then Claude on Replicate, whichever is configured first) or Custom mode (title, tagged lyrics, style tags, instrumental, 1 or 2 takes). Each new song can get FLUX Schnell cover art (optional, about $0.003); derived songs inherit their parent's cover. Finished audio and covers are format-checked and stored with `meta.json` under `data/studio/songs/<id>/` (or `VBM_DATA_DIR`). From the library a song can be split into stems (Demucs) and played in a stem mixer, reimagined (MiniMax Music-01), given a local ffmpeg Studio Master (-14 LUFS, -1 dBTP; original kept, A/B in the player), or sung in a voice from the shared registry. In Custom mode a song can also be summoned directly in a forged voice: MiniMax Music-01 takes a 30 s excerpt of that voice's Gold Vocal plus a music reference from the library. Only voices that are `ready` with own-voice consent are offered, and the voice id and consent session are recorded in the song's metadata. A song can also be extended, have a section repainted, or be restyled (cover); every edit is a new song, run on the self-hosted engine or fal ACE-Step v1 edit endpoints when available. *The Séance* runs one take per model (2 to 4 models) on the same prompt and lyrics, hides which model made each take until you rank them, then reveals them and keeps a leaderboard. A lyrics workshop writes, rewrites and extends lyrics. Paid actions cost from a fraction of a cent to about $0.50 each; new paid work is refused while 3 jobs are running (4 for Séance takes). That is a local guard, not a spend cap.
- **How they connect:** Vocal Fix writes forged voices to the shared registry in `data/shared/voices/`; TTB Studio reads it and offers only `ready` voices with own-voice consent. Both apps share the `packages/ui` design system and `packages/contracts` types. There is still no authentication, so this connection is for local development only.

## Verification status

From `CHANGELOG.md` and the test suites (6 November 2026). *Real-call verified*: a real provider response is recorded in the changelog or in a test written from a live run. *Mock-tested only*: tests use mocked HTTP or check input mapping, and no successful real call is recorded. *Never run*: no test calls it and no real call is recorded.

| Status | Provider / adapter |
| --- | --- |
| Real-call verified | fal ACE-Step 1.5 song generation (`fal-ai/ace-step-1.5`; its real FLAC output led to the ID3/FLAC fix). Replicate Demucs vocal isolation in Vocal Fix (`server.test.ts`, "replicate regressions (live e2e)"). Local ffmpeg/ffprobe intake, diagnosis, polish presets and Gold Vocal assembly in Vocal Fix (real ffmpeg in tests and CI; intake and diagnosis tested end to end with an AI-generated synthetic voice, not a real singer). |
| Mock-tested only | Google Lyria 3.5 direct (one real call is recorded, refused because the project had no billing). Gemini automatic lyrics for fal ACE-Step. Lyricist chain: Anthropic, OpenAI, Gemini direct, and Claude on Replicate (parsing only). Replicate MiniMax Music 1.5 (full create, poll and store); Replicate ACE-Step and Stable Audio 2.5 (input mapping only). TTB Studio Demucs stems, Sing in my voice (`zsxkib/realistic-voice-cloning`) and FLUX Schnell covers. Summon in my voice (checks before submission only). Studio Master (ffmpeg arguments and report parsing). Models-by-runners routing, including the Replicate entries and the fal runner. fal ACE-Step v1 edit endpoints (Extend, Replace, Restyle). Direct MiniMax Music 2.6, ElevenLabs Music and Gemini Lyria 3 Pro ("mocked, never run live"). The TTB Studio engine runner, and the engine's API, queue and auth (fake sine-wave backend). |
| Never run | Self-hosted engine backends ACE-Step 1.5, HeartMuLa, DiffRhythm 2 and YuE2 on real weights; the Modal app was never deployed. Replicate Lyria 2. Reimagine (MiniMax Music-01). resemble-enhance (Vocal Fix AI enhance). RVC voice training (`replicate/train-rvc-model`). |

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

Neither app needs Python: both pipelines run in the SvelteKit servers. Put keys in `apps/vocal-fix/.env` and `apps/ttb-studio/.env` (git-ignored; see `.env.example`). The legacy Python prototypes below are optional and unused by either UI; they need Python 3.11+ (the example uses 3.11):

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Terminal C
uvicorn apps.vocal_fix.app:app --host 127.0.0.1 --port 8001

# Optional, legacy prototype not used by TTB Studio (same activated environment)
uvicorn apps.ttb_studio.app:app --host 127.0.0.1 --port 8002
```

**Security warning:** nothing here has account authentication. The SvelteKit apps block uploads, processing and generation in production until real user authentication, tenant isolation and billing are implemented. Do not expose the Python ports or the self-hosted engine directly.

The optional self-hosted music engine has its own setup in [services/audio-engine](services/audio-engine/README.md) and [protocol](docs/ENGINE_PROTOCOL.md). It refuses to start without `VBM_ENGINE_TOKEN`.

## If the default ports are occupied

Use these instead of the default dev commands, one per terminal from the repository root. The URL overrides keep the sister-app links aligned with the new ports; `--strictPort` prevents silent fallback to another port.

```bash
(cd apps/vocal-fix && VITE_TTB_STUDIO_URL=http://127.0.0.1:5414 bun run dev --port 5413 --strictPort)
(cd apps/ttb-studio && VITE_VOCAL_FIX_URL=http://127.0.0.1:5413 bun run dev --port 5414 --strictPort)
```

Open http://127.0.0.1:5413 and http://127.0.0.1:5414. If those ports are already in use, choose another pair and update both URL overrides. Do not stop another project's server to free a port.

**What each app needs** (development only):

- `ffmpeg` and `ffprobe`. Vocal Fix uses `VBM_FFMPEG` / `VBM_FFPROBE`, TTB Studio's master uses `FFMPEG_PATH`; both otherwise use PATH, then `/usr/local/bin`.
- `apps/vocal-fix/.env` with `REPLICATE_API_TOKEN=...` for the paid hosted stages (Demucs, resemble-enhance, RVC training). Without it, intake, diagnosis, local repair and Gold Vocal still work, and hosted stages answer 503.
- `apps/ttb-studio/.env` with any of `REPLICATE_API_TOKEN`, `FAL_KEY`, `GEMINI_API_KEY`, `MINIMAX_API_KEY`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `VBM_ENGINE_URL` with `VBM_ENGINE_TOKEN` for a self-hosted engine. Models and actions without their key show as unavailable or answer 503. Stems, reimagine, voice, voice summon and cover art need Replicate.
- `VITE_TTB_STUDIO_URL` / `VITE_VOCAL_FIX_URL` (as in the commands above) so the sister-app links point at 5414 / 5413. They are read at build or dev start.

Both `.env` files are git-ignored. Sessions, test material, songs and the shared voice registry live in `data/` at the repository root (or `VBM_DATA_DIR`). `data/` is git-ignored and must never be committed.

## Build and test

For lint, formatting and strict Python typing, activate the Python environment
and install `pip install -r requirements-dev.txt` in addition to `bun install --frozen-lockfile`.
Run `bun run lint`, `bun run format:check` and `bun run check:python`.
`bun run format` applies the formatters; check commands do not rewrite source.
To block commits that contain secrets, install [gitleaks](https://github.com/gitleaks/gitleaks) and run `bun run hooks:install` once per clone; CI also scans the full history with gitleaks.
TypeScript/Svelte checks remain `bun run check`. Python checks cover both legacy APIs and tests. `bun run test` needs ffmpeg (Vocal Fix tests make small audio files). The engine has its own checks, `bun run test:engine`, `lint:engine` and `check:engine`, which expect a venv at `services/audio-engine/.venv`.

```bash
bun run test
bun run check
bun run build
python -m pytest -q
```

On a Linux host, run each production build with Bun and manage it with systemd (sample units in [infra/systemd](infra/systemd)). See [SaaS stack and deployment](docs/SAAS_STACK.md). Docker is optional legacy convenience only; not required by the new applications.

> **Current functional limits:** This is a local development prototype, not a production-ready music platform. Vocal processing, voice training and song generation run only in local development. Premium Studio DSP, payments, database persistence, spend caps and public user authentication are not implemented. Consent is a self-attested name and checkbox recorded on disk, not verified identity. The self-hosted engine is tested in CI only with a fake backend, and many hosted adapters are mock-tested only (see [Verification status](#verification-status)). Never represent a request as generated audio without a verified model result.

## Architecture and contributing

The two Svelte 5 + SvelteKit 3 apps build independently in a Bun workspace. TTB remains a modular monolith. Shared packages hold contracts and UI; auth, database and billing packages are interfaces rather than working integrations. The Python APIs in `apps/` are legacy prototypes; `services/audio-engine` is a separate, optional self-hosted GPU music engine that TTB Studio calls over HTTP.

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
- [Self-hosted engine protocol](docs/ENGINE_PROTOCOL.md)
- [Rights, authorization and privacy](docs/RIGHTS_AND_SAFETY.md)
- [Agent implementation handoff](AGENTS.md)
- [Project library](library/README.md): knowledge docs in `library/knowledge/private/` (`architecture`, `security`, `auth`), Draft contracts in `library/knowledge/private/contracts`, backlog PRDs in `library/requirements/backlog`, and a wiki and code graph in `library/knowledge/private/wiki` (`codegraph.md`; regenerate with `python3.12 library/knowledge/private/wiki/tools/build_codegraph.py`)

## Licensing and vocal rights

Copyright (C) 2026 Vocal Black Magic Contributors. Original application code is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later). If you run a modified version as a network service, the AGPL requires you to offer its users the corresponding source code. Copies obtained before this change remain available under the MIT terms they were published with. Individual models, weights, datasets, licensed samples, proprietary V2 APIs and commercial outputs are governed by independent terms. A publicly accessible recording does **not** authorize imitation of the vocalist. Vocal reference processing requires the performer's permission and appropriate recording rights.
