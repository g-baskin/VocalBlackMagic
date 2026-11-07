---
type: entity
title: "CUDA_VISIBLE_DEVICES"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/diffrhythm.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-backend-diffrhythm]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related: []
sources:
  - "services/audio-engine/vbm_engine/backends/diffrhythm.py"
---

# CUDA_VISIBLE_DEVICES

## Overview

GPU visibility for the DiffRhythm subprocess (`services/audio-engine/vbm_engine/backends/diffrhythm.py:127-130`).

## Signature / Definition

```text
CUDA_VISIBLE_DEVICES
```

## Behavior

- Readers: `services/audio-engine/vbm_engine/backends/diffrhythm.py:130`, passed at `:105`.
- Default: `0` on CUDA when unset; empty string on other devices.
- Validation: none.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-backend-diffrhythm]]
- **related:** none found in source

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/diffrhythm.py`
