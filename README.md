# Vocal Black Magic

An open-source monorepo for **two independently deployable applications**:

1. **Vocal Fix** — permission-based vocal cleanup, five-track reference analysis, vocal isolation, Gold Vocal reference preparation and vocal-character prompt building.
2. **TTB Studio** — a modular-monolith, Suno-style text-to-beat and song-generation workspace with model adapters, configurable raw sound and optional Premium Studio mastering.

> **Project state:** architecture and runnable API/UI starter scaffold. AI separation, vocal-reference synthesis, model inference, and export pipelines are planned integrations, **not yet implemented**. The software must not fabricate a generated audio result.

## Start here

- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap and acceptance criteria](docs/ROADMAP.md)
- [Model and audio pipeline notes](docs/MODELS_AND_AUDIO.md)
- [Rights, consent, and privacy](docs/RIGHTS_AND_SAFETY.md)

## Local development

Requires Python 3.11+.

```bash
git clone https://github.com/g-baskin/VocalBlackMagic.git
cd VocalBlackMagic
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn apps.vocal_fix.app:app --reload --port 8001
# Separate terminal:
uvicorn apps.ttb_studio.app:app --reload --port 8002
```

Open **Vocal Fix:** http://localhost:8001 and **TTB Studio:** http://localhost:8002.

Run `pytest -q` for the starter tests.

## Design principles

- **Two separate products, one shared codebase:** independent app lifecycles, shared contracts, audio utilities and infrastructure.
- **TTB Studio is a modular monolith:** a single app surface and backend for song creation, projects, generation orchestration, preview and editing. GPU compute may run out-of-process when deployed.
- **Sound character ≠ sound quality:** Raw / Underground, Vintage / Analog, Live / Organic and Studio Clean presets; finishing is always optional.
- **Premium Studio is opt-in:** preserve original dry/raw audio; process a derived copy, never overwrite sources.
- **Five-track Gold Vocal:** isolate and quality-check permitted inputs, curate representative clean segments, build a reference asset plus descriptive prompt; no destructive averaging of five waveforms.
- **Licensed model adapters:** ACE-Step, HeartMuLa and a configurable external V2 provider adapter. Verify actual model/provider availability, rights, licensing, and commercial terms before enabling.
- **No identity forgery by default:** vocal identity recreation requires an authorized speaker with documented consent. No training/inference using an artist's voice solely because reference audio is available.

## Status

See [ROADMAP.md](docs/ROADMAP.md) before implementing model-dependent features. This repository contains no pretrained weights, copyrighted reference recordings or credentials.

## License

MIT for original application code in this repository. Dependencies and individual model weights have their own licenses.
