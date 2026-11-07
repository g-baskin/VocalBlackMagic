---
type: entity
title: "backends/ace_step.py (ACE-Step 1.5 backend)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/ace_step.py"
language: py
depends_on:
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/mod-engine-device]]"
  - "[[entities/env-vbm-engine-allow-cpu]]"
  - "[[entities/env-vbm-acestep-lm-backend]]"
  - "[[entities/ext-huggingface-co]]"
used_by:
  - "[[entities/mod-engine-backend-init]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-engine-backends]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-model-readiness]]"
  - "[[entities/engine-install-ace-step]]"
sources:
  - "services/audio-engine/vbm_engine/backends/ace_step.py"
---

# backends/ace_step.py (ACE-Step 1.5 backend)

## Overview

ACE-Step 1.5 (MIT) backend using the upstream Python API at a pinned commit; supports all four tasks, with extend done as repaint over padded silence (`services/audio-engine/vbm_engine/backends/ace_step.py:1-20`, `services/audio-engine/vbm_engine/backends/ace_step.py:42-47`).

## Signature / Definition

```py
UPSTREAM_COMMIT; HF_REPO = "ACE-Step/Ace-Step1.5"; HF_REVISION (pinned); DIT_CONFIG = "acestep-v15-turbo"; LM_MODEL = "acestep-5Hz-lm-1.7B"; MIN_CUDA_GB = 12.0
class AceStepBackend(cache_dir): id=ace-step-1.5, license=MIT, commercial=True, tasks=(text2music, extend, repaint, cover), max_duration_seconds=600
```

## Behavior

- `HF_REPO` and `HF_REVISION` are module constants, not environment variables (`services/audio-engine/vbm_engine/backends/ace_step.py:32-33`).
- Readiness requires `acestep` and `torch`, four non-empty checkpoint folders, 12 GB on CUDA, and `VBM_ENGINE_ALLOW_CPU` on CPU (`services/audio-engine/vbm_engine/backends/ace_step.py:38`, `services/audio-engine/vbm_engine/backends/ace_step.py:55-74`, `services/audio-engine/vbm_engine/backends/ace_step.py:177-180`).
- `download` uses `huggingface_hub.snapshot_download` at the pinned revision (`services/audio-engine/vbm_engine/backends/ace_step.py:76-80`).
- The DiT and LM handlers load once under a lock; the LM backend is `VBM_ACESTEP_LM_BACKEND`, default `pt` (`services/audio-engine/vbm_engine/backends/ace_step.py:82-104`).
- Extend runs after-first then before as repaint spans `[len, len+after]` and `[-before, 0]` (`services/audio-engine/vbm_engine/backends/ace_step.py:114-124`).
- Cover strength is inverted for upstream (`1.0 - strength`); options `inference_steps`, `guidance_scale`, `shift`, `bpm` pass through; output is wav (`services/audio-engine/vbm_engine/backends/ace_step.py:153-161`). Upstream failure raises `RuntimeError` (`services/audio-engine/vbm_engine/backends/ace_step.py:164-167`).

## Connections

- **depends_on:** [[entities/mod-engine-backend-base]], [[entities/mod-engine-device]], [[entities/env-vbm-engine-allow-cpu]], [[entities/env-vbm-acestep-lm-backend]], [[entities/ext-huggingface-co]]
- **used_by:** [[entities/mod-engine-backend-init]]
- **related:** [[concepts/engine-model-readiness]], [[entities/engine-install-ace-step]]

## Tested by

- [[entities/test-engine-backends]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/ace_step.py`
