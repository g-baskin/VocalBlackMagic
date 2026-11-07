---
type: entity
title: "HF_HUB_CACHE"
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
related:
  - "[[entities/ext-huggingface-co]]"
sources:
  - "services/audio-engine/vbm_engine/backends/diffrhythm.py"
---

# HF_HUB_CACHE

## Overview

Hub cache path set for the DiffRhythm subprocess so inference reuses downloaded weights (`services/audio-engine/vbm_engine/backends/diffrhythm.py:102-104`).

## Signature / Definition

```text
HF_HUB_CACHE
```

## Behavior

- Readers: written at `services/audio-engine/vbm_engine/backends/diffrhythm.py:104`; not read by repo code.
- Default: set to `<cache>/diffrhythm-2/hf` for the child only.
- Validation: none.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-backend-diffrhythm]]
- **related:** [[entities/ext-huggingface-co]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/diffrhythm.py`
