---
type: entity
title: "vbm_engine/validation.py (request validator)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/validation.py"
language: py
depends_on:
  - "[[entities/mod-contracts-engine]]"
used_by:
  - "[[entities/mod-engine-app]]"
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/test-engine-validation-parity]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-validation-parity]]"
  - "[[entities/test-engine-protocol]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-validation-parity]]"
sources:
  - "services/audio-engine/vbm_engine/validation.py"
---

# vbm_engine/validation.py (request validator)

## Overview

Python mirror of `validateEngineJobRequest` in `packages/contracts/src/engine.ts`; messages must stay identical and a shared fixture checks both (`services/audio-engine/vbm_engine/validation.py:1-7`).

## Signature / Definition

```py
MODEL_IDS = (ace-step-1.5, heartmula, diffrhythm-2, yue2)
TASKS = (text2music, extend, repaint, cover)
AUDIO_FORMATS = (wav, flac, mp3); MAX_PROMPT = 2000; MAX_LYRICS = 6000
def validate_engine_job_request(body: object) -> str | None
```

## Behavior

- Constants (`services/audio-engine/vbm_engine/validation.py:13-17`). String lengths count UTF-16 code units like JavaScript (`services/audio-engine/vbm_engine/validation.py:20-21`); numbers must be finite and never bool (`services/audio-engine/vbm_engine/validation.py:24-25`).
- Order of checks: object, model, task, prompt 1..2000, seed non-negative integer, instrumental bool, lyrics <= 6000, duration 5..600 (`services/audio-engine/vbm_engine/validation.py:34-58`).
- Edit tasks need `source_audio.data_b64` and a format in wav/flac/mp3 (`services/audio-engine/vbm_engine/validation.py:59-66`); repaint needs `0 <= start < end` (`services/audio-engine/vbm_engine/validation.py:67-71`); extend needs before/after >= 0 summing to (0, 240] with null treated as 0 (`services/audio-engine/vbm_engine/validation.py:72-85`); cover strength 0..1 (`services/audio-engine/vbm_engine/validation.py:86-90`).

## Connections

- **depends_on:** [[entities/mod-contracts-engine]]
- **used_by:** [[entities/mod-engine-app]], [[entities/ep-engine-post-v1-jobs]], [[entities/test-engine-validation-parity]]
- **related:** [[concepts/engine-validation-parity]]

## Tested by

- [[entities/test-engine-validation-parity]]
- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/validation.py`
