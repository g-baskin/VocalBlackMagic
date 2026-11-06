# Vocal Black Magic

![Vocal Black Magic: from a raw voice to a finished song](docs/assets/banner.png)

**Two independently deployable SaaS applications, one lightweight Bun workspace.** Svelte 5 + SvelteKit 3 are the public-facing architecture; Python is retained for local audio prototypes and planned GPU processing.

| Product | Location | Developer URL |
| --- | --- | --- |
| Vocal Fix | [apps/vocal-fix](apps/vocal-fix) | http://localhost:5173 |
| TTB Studio | [apps/ttb-studio](apps/ttb-studio) | http://localhost:5174 |

- **Vocal Fix**: exactly five authorized recordings, source intake, session deletion, future isolation/cleanup, Gold Vocal and descriptive voice-character profile.
- **TTB Studio**: Suno-style beat/song creation workspace, ACE-Step / HeartMuLa / external V2 adapter slots, raw/vintage/live/clean styles, opt-in Premium Studio finishing. **TTB is a modular monolith**, not a sprawling service mesh.
- **Shared packages**: `@vbm/contracts`, `@vbm/ui`, `@vbm/auth`, `@vbm/database`, `@vbm/billing`.
- **Audio prototypes**: the existing Python APIs remain in `apps/vocal_fix` and `apps/ttb_studio`. The future GPU worker belongs under `services/audio-engine`.

## Start the SaaS without Docker

Requires [Bun 1.4+](https://bun.com/) and **no container runtime**.

```bash
git clone https://github.com/g-baskin/VocalBlackMagic.git
cd VocalBlackMagic
bun install

# Terminal A — Vocal Fix
bun run dev:vocal

# Terminal B — TTB Studio
bun run dev:ttb
```

The SvelteKit user interfaces run independently even when the Python audio services are offline. To enable **local development only** of reference upload and backend-capability discovery:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Terminal C
uvicorn apps.vocal_fix.app:app --host 127.0.0.1 --port 8001

# Terminal D (same activated environment)
uvicorn apps.ttb_studio.app:app --host 127.0.0.1 --port 8002
```

**Security warning:** the original Python prototypes have no account authentication. The SvelteKit bridges block uploads/generation in production until real user authentication, tenant isolation and billing are implemented. Do not expose the Python ports directly.

## Build and test

```bash
bun test packages
bun run check
bun run build
python -m pytest -q
```

On a Linux host, run each production build with Bun and manage it with systemd (sample units in [infra/systemd](infra/systemd)). See [SaaS stack and deployment](docs/SAAS_STACK.md). Docker is optional legacy convenience only; not required by the new applications.

> **Current functional limits:** This is a SaaS UI and API-boundary scaffold, not a production-ready music platform. Vocal source upload is available only in local development; Gold Vocal separation, voice conditioning, real song inference, Premium Studio DSP, payments, database persistence and public user authentication are not implemented. Never represent a request as generated audio without a verified model result.

## Architecture and build specification

- [SaaS stack and Docker-free deployment](docs/SAAS_STACK.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Audio models and Gold Vocal pipeline](docs/MODELS_AND_AUDIO.md)
- [Rights, authorization and privacy](docs/RIGHTS_AND_SAFETY.md)
- [Agent implementation handoff](AGENTS.md)

## Licensing and vocal rights

Original application code is MIT-licensed. Individual models, weights, datasets, licensed samples, proprietary V2 APIs and commercial outputs are governed by independent terms. A publicly accessible recording does **not** authorize imitation of the vocalist. Vocal reference processing requires the performer's permission and appropriate recording rights.
