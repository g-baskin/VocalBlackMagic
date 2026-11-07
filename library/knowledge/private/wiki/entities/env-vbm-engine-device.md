---
type: entity
title: "VBM_ENGINE_DEVICE"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/device.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-device]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[concepts/engine-model-readiness]]"
sources:
  - "services/audio-engine/vbm_engine/device.py"
---

# VBM_ENGINE_DEVICE

## Overview

Forces the engine device (`services/audio-engine/vbm_engine/device.py:11-13`).

## Signature / Definition

```text
VBM_ENGINE_DEVICE
```

## Behavior

- Readers: `services/audio-engine/vbm_engine/device.py:11`.
- Default: unset: auto-detect cuda, mps, cpu.
- Validation: lower-cased; only `cuda`, `mps`, `cpu` are honoured, others ignored.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-device]]
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/device.py`
