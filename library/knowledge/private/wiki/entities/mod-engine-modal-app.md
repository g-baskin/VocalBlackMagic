---
type: entity
title: "modal_app.py (Modal deployment, not deployed)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/modal_app.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-download]]"
  - "[[entities/env-vbm-modal-gpu]]"
  - "[[entities/env-vbm-modal-backend]]"
  - "[[entities/env-vbm-modal-scaledown]]"
  - "[[entities/env-vbm-engine-token]]"
  - "[[entities/ext-download-pytorch-org]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-deployment-targets]]"
  - "[[questions/engine-modal-image-missing-model-deps]]"
sources:
  - "services/audio-engine/modal_app.py"
---

# modal_app.py (Modal deployment, not deployed)

## Overview

Modal serverless-GPU wrapper for the engine; its docstring states it is NOT DEPLOYED and that running its commands spends money (`services/audio-engine/modal_app.py:1-32`).

## Signature / Definition

```py
APP_NAME = "vbm-engine"; GPU = env VBM_MODAL_GPU or "L4"; BACKEND = env VBM_MODAL_BACKEND or "ace-step"; SCALEDOWN_SECONDS = int(env VBM_MODAL_SCALEDOWN or "60")
def _image() -> modal.Image
@app.function(...) def web() -> ASGI app
@app.function(...) def download(model: str) -> None
```

## Behavior

- Env reads happen at module import on the deploying machine (`services/audio-engine/modal_app.py:46-48`); unknown backends raise `ValueError` (`services/audio-engine/modal_app.py:53-65`).
- Image: CUDA 12.8 base with Python 3.12, apt `git ffmpeg libsndfile1 espeak-ng`, base requirements, then ACE-Step via `install-ace-step.sh` or torch from the PyTorch index (`services/audio-engine/modal_app.py:66-78`); sets `VBM_ENGINE_CACHE=/cache`, `VBM_ENGINE_DATA=/cache/data`, `HF_HOME=/cache/hf` (`services/audio-engine/modal_app.py:79-85`).
- Imports without `modal` installed (`services/audio-engine/modal_app.py:40-43`).
- `web` runs one container at most, 32 concurrent inputs, the token from Modal secret `vbm-engine-token`, and `local_bind=False` so the Host guard is off (`services/audio-engine/modal_app.py:88-112`).
- `download` runs on a CPU container and commits the volume (`services/audio-engine/modal_app.py:114-122`).
- Cost figures in the docstring are code comments, not verified here (`services/audio-engine/modal_app.py:23-27`) (unverified).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/mod-engine-download]], [[entities/env-vbm-modal-gpu]], [[entities/env-vbm-modal-backend]], [[entities/env-vbm-modal-scaledown]], [[entities/env-vbm-engine-token]], [[entities/ext-download-pytorch-org]]
- **used_by:** none found in source
- **related:** [[concepts/engine-deployment-targets]], [[questions/engine-modal-image-missing-model-deps]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/modal_app.py`
