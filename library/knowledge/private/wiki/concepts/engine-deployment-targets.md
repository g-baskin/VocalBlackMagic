---
type: concept
title: "Engine deployment targets"
complexity: intermediate
domain: "vocal-black-magic"
aliases: []
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - engine
related:
  - "[[entities/mod-engine-main]]"
  - "[[entities/mod-engine-modal-app]]"
  - "[[entities/engine-dockerfile]]"
  - "[[entities/env-vbm-engine-token]]"
  - "[[entities/env-vbm-engine-url]]"
  - "[[entities/mod-studio-runner-engine]]"
sources:
  - "services/audio-engine/vbm_engine/__main__.py"
  - "services/audio-engine/modal_app.py"
  - "services/audio-engine/Dockerfile"
---

# Engine deployment targets

## Definition

Three ways to run the engine (local process, Docker on a GPU host, Modal) and how auth and the Host guard differ.

## How it works

- Local: `python -m vbm_engine` on 127.0.0.1:8090 with the Host guard on (`services/audio-engine/vbm_engine/__main__.py:24-36`).
- Docker binds 0.0.0.0, so the guard is off and only the token protects it (`services/audio-engine/Dockerfile:54-55`).
- Modal: public URL, `local_bind=False`, one container, not deployed (`services/audio-engine/modal_app.py:1`, `services/audio-engine/modal_app.py:99`, `services/audio-engine/modal_app.py:112`).
- Every target needs `VBM_ENGINE_TOKEN` (`services/audio-engine/vbm_engine/app.py:104-105`); TTB Studio connects with `VBM_ENGINE_URL` plus the token (`apps/ttb-studio/src/lib/server/studio/context.ts:41-46`).

## Related

- [[entities/mod-engine-main]]
- [[entities/mod-engine-modal-app]]
- [[entities/engine-dockerfile]]
- [[entities/env-vbm-engine-token]]
- [[entities/env-vbm-engine-url]]
- [[entities/mod-studio-runner-engine]]
