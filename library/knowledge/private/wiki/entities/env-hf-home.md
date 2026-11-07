---
type: entity
title: "HF_HOME"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/diffrhythm.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-backend-diffrhythm]]"
  - "[[entities/mod-engine-modal-app]]"
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
  - "services/audio-engine/modal_app.py"
  - "services/audio-engine/Dockerfile"
---

# HF_HOME

## Overview

Hugging Face home directory. The engine sets it for others and never reads it itself (`services/audio-engine/vbm_engine/backends/diffrhythm.py:101`).

## Signature / Definition

```text
HF_HOME
```

## Behavior

- Readers: written for the DiffRhythm subprocess (`services/audio-engine/vbm_engine/backends/diffrhythm.py:101`); Modal image `/cache/hf` (`services/audio-engine/modal_app.py:83`); Dockerfile `/cache/hf` (`services/audio-engine/Dockerfile:20`); consumed by `huggingface_hub` (external library; unverified here).
- Default: library default when unset (unverified).
- Validation: none.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-backend-diffrhythm]], [[entities/mod-engine-modal-app]]
- **related:** [[entities/ext-huggingface-co]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/diffrhythm.py`
- `services/audio-engine/modal_app.py`
- `services/audio-engine/Dockerfile`
