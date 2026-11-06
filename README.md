# Vocal Black Magic

![Vocal Black Magic: from a raw voice to a finished song](docs/assets/banner.png)

**Two apps, one purpose: help artists turn their own voice into original music.**

Vocal Fix is the reference-intake side; TTB Studio is the song-planning side. The goal is an authorized vocal-to-song workflow that preserves the performance rather than replacing its character.

> **Prototype, not a working generation platform.** Local reference upload and deletion work with the Python backend. Vocal cleanup, Gold Vocal assembly, voice conditioning, song generation and Premium Studio processing are not implemented. Authentication, tenant storage and billing are also pending.

| Product | Location | Developer URL |
| --- | --- | --- |
| Vocal Fix | [apps/vocal-fix](apps/vocal-fix) | http://localhost:5173 |
| TTB Studio | [apps/ttb-studio](apps/ttb-studio) | http://localhost:5174 |

## What each app does

- **Vocal Fix:** accepts exactly five recordings, a performer name and a rights attestation. It stores source files and a session manifest locally. Upload success is not proof of valid decoded audio or a finished Gold Vocal.
- **TTB Studio:** lets you prepare prompts, lyrics, sound character and optional Premium Studio settings. ACE-Step, HeartMuLa and external V2 are unconfigured adapter choices, not active integrations. Generation requests return an explicit unavailable error.
- **Planned connection:** a curated Gold Vocal and descriptive profile can become an input to song creation once the processing pipeline and appropriate authorization checks exist. There is no automatic audio transfer today.

## Run locally without Docker

Requires [Node.js 22.17+ (22.x)](https://nodejs.org/) and npm 11.6.2 and **no container runtime**.

```bash
git clone https://github.com/g-baskin/VocalBlackMagic.git
cd VocalBlackMagic
npm ci

# Terminal A: Vocal Fix
npm run dev:vocal

# Terminal B: TTB Studio
npm run dev:ttb
```

The SvelteKit user interfaces run independently even when the Python audio services are offline. To enable **local development only** of reference upload and backend-capability discovery, use Python 3.11+ (the example uses 3.11):

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Terminal C
uvicorn apps.vocal_fix.app:app --host 127.0.0.1 --port 8001

# Terminal D (same activated environment)
uvicorn apps.ttb_studio.app:app --host 127.0.0.1 --port 8002
```

**Security warning:** the original Python prototypes have no account authentication. The SvelteKit bridges block uploads/generation in production until real user authentication, tenant isolation and billing are implemented. Do not expose the Python ports directly.

## If the default ports are occupied

Use these instead of the default dev commands, one per terminal from the repository root. The URL overrides keep the sister-app links aligned with the new ports; `--strictPort` prevents silent fallback to another port.

```bash
(cd apps/vocal-fix && VITE_TTB_STUDIO_URL=http://127.0.0.1:5414 npm run dev -- --port 5413 --strictPort)
(cd apps/ttb-studio && VITE_VOCAL_FIX_URL=http://127.0.0.1:5413 npm run dev -- --port 5414 --strictPort)
```

Open http://127.0.0.1:5413 and http://127.0.0.1:5414. If those ports are already in use, choose another pair and update both URL overrides. Do not stop another project's server to free a port.

## Build and test

```bash
npm test
npm run check
npm run build
npm run test:production
python -m pytest -q
```

On a Linux host, run each production build with Node.js and manage it with systemd (sample units in [infra/systemd](infra/systemd)). See [SaaS stack and deployment](docs/SAAS_STACK.md). Docker is optional legacy convenience only; not required by the new applications.

> **Current functional limits:** This is a SaaS UI and API-boundary scaffold, not a production-ready music platform. Vocal source upload is available only in local development; Gold Vocal separation, voice conditioning, real song inference, Premium Studio DSP, payments, database persistence and public user authentication are not implemented. Never represent a request as generated audio without a verified model result.

## Architecture and contributing

The two Svelte 5 + SvelteKit 3 apps build independently in an npm workspace. TTB remains a modular monolith. Shared packages hold contracts and UI; auth, database and billing packages are interfaces rather than working integrations. Python APIs are local prototypes, with GPU inference planned separately.

Before contributing, read the [agent handoff](AGENTS.md) and the relevant specification below. Keep implemented behavior distinct from planned capabilities, and preserve the two independent apps.


- [SaaS stack and Docker-free deployment](docs/SAAS_STACK.md)
- [Changelog](CHANGELOG.md)
- [Release procedure](docs/RELEASING.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Audio models and Gold Vocal pipeline](docs/MODELS_AND_AUDIO.md)
- [Rights, authorization and privacy](docs/RIGHTS_AND_SAFETY.md)
- [Agent implementation handoff](AGENTS.md)

## Licensing and vocal rights

Original application code is MIT-licensed. Individual models, weights, datasets, licensed samples, proprietary V2 APIs and commercial outputs are governed by independent terms. A publicly accessible recording does **not** authorize imitation of the vocalist. Vocal reference processing requires the performer's permission and appropriate recording rights.
