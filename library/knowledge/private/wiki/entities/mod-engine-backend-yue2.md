---
type: entity
title: "backends/yue2.py (YuE2 backend, non-commercial)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/yue2.py"
language: py
depends_on:
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/mod-engine-backend-common]]"
  - "[[entities/ext-huggingface-co]]"
used_by:
  - "[[entities/mod-engine-backend-init]]"
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
  - "services/audio-engine/vbm_engine/backends/yue2.py"
---

# backends/yue2.py (YuE2 backend, non-commercial)

## Overview

YuE2-3B backend whose weights are CC BY-NC 4.0, reported as `commercial: False`; CUDA only, text2music only (`services/audio-engine/vbm_engine/backends/yue2.py:1-13`, `services/audio-engine/vbm_engine/backends/yue2.py:29-34`).

## Signature / Definition

```py
HF_REPO = "m-a-p/YuE2-3B"; HF_REVISION (pinned); MIN_CUDA_GB = 24.0
class YuE2Backend(cache_dir): id=yue2, license=CC-BY-NC-4.0, commercial=False, max_duration_seconds=600
```

## Behavior

- Readiness needs the `yue2` module, `config.json`, and a CUDA device with 24 GB (`cuda_only=True`) (`services/audio-engine/vbm_engine/backends/yue2.py:41-50`).
- `download` snapshots the pinned revision (`services/audio-engine/vbm_engine/backends/yue2.py:52-56`).
- Generation passes `style`, `lyrics`, `cot` (option, default `full`) and `seed`; duration is not a control for this model; output `yue2.flac` (`services/audio-engine/vbm_engine/backends/yue2.py:12`, `services/audio-engine/vbm_engine/backends/yue2.py:66-75`).

## Connections

- **depends_on:** [[entities/mod-engine-backend-base]], [[entities/mod-engine-backend-common]], [[entities/ext-huggingface-co]]
- **used_by:** [[entities/mod-engine-backend-init]]
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- [[entities/test-engine-backends]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/yue2.py`
