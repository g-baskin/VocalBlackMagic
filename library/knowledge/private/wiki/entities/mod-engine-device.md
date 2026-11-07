---
type: entity
title: "vbm_engine/device.py (device detection)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/device.py"
language: py
depends_on:
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/env-vbm-engine-device]]"
used_by:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-backend-common]]"
  - "[[entities/mod-engine-backend-ace-step]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-model-readiness]]"
sources:
  - "services/audio-engine/vbm_engine/device.py"
---

# vbm_engine/device.py (device detection)

## Overview

Chooses `cuda`, then `mps`, then `cpu`, with torch optional, and reports CUDA device 0 memory (`services/audio-engine/vbm_engine/device.py:1`, `services/audio-engine/vbm_engine/device.py:10-34`).

## Signature / Definition

```py
def detect_device() -> str
def gpu_memory_gb() -> float | None
```

## Behavior

- `VBM_ENGINE_DEVICE` forces `cuda`, `mps` or `cpu`; any other value falls through to detection (`services/audio-engine/vbm_engine/device.py:11-13`).
- Without an importable `torch` the device is `cpu` (`services/audio-engine/vbm_engine/device.py:14-15`).
- `gpu_memory_gb` returns total memory of CUDA device 0 in GB, or `None` (`services/audio-engine/vbm_engine/device.py:26-34`); used by readiness thresholds (`services/audio-engine/vbm_engine/backends/common.py:31-36`, `services/audio-engine/vbm_engine/backends/ace_step.py:66-71`).

## Connections

- **depends_on:** [[entities/mod-engine-backend-base]], [[entities/env-vbm-engine-device]]
- **used_by:** [[entities/mod-engine-app]], [[entities/mod-engine-backend-common]], [[entities/mod-engine-backend-ace-step]]
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/device.py`
