---
type: entity
title: "vbm_engine/backends/common.py (shared readiness)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/common.py"
language: py
depends_on:
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/mod-engine-device]]"
  - "[[entities/env-vbm-engine-allow-cpu]]"
used_by:
  - "[[entities/mod-engine-backend-diffrhythm]]"
  - "[[entities/mod-engine-backend-heartmula]]"
  - "[[entities/mod-engine-backend-yue2]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-backends]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-model-readiness]]"
sources:
  - "services/audio-engine/vbm_engine/backends/common.py"
---

# vbm_engine/backends/common.py (shared readiness)

## Overview

Readiness checks shared by HeartMuLa, DiffRhythm 2 and YuE2 (`services/audio-engine/vbm_engine/backends/common.py:1`, `services/audio-engine/vbm_engine/backends/common.py:15-41`).

## Signature / Definition

```py
def allow_cpu() -> bool
def check(modules, req_file, model_id, weights, device, min_gb, cuda_only=False) -> Readiness
```

## Behavior

- `allow_cpu` is true for `VBM_ENGINE_ALLOW_CPU` in `1`/`true`/`yes` (`services/audio-engine/vbm_engine/backends/common.py:11-12`).
- Order: missing `torch` or listed modules -> not installed; missing weight paths -> not installed; CUDA memory below `min_gb` -> installed, not ready; `cuda_only` on a non-CUDA device -> not ready; CPU without opt-in -> not ready (`services/audio-engine/vbm_engine/backends/common.py:24-41`).

## Connections

- **depends_on:** [[entities/mod-engine-backend-base]], [[entities/mod-engine-device]], [[entities/env-vbm-engine-allow-cpu]]
- **used_by:** [[entities/mod-engine-backend-diffrhythm]], [[entities/mod-engine-backend-heartmula]], [[entities/mod-engine-backend-yue2]]
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- [[entities/test-engine-backends]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/common.py`
