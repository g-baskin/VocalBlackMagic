---
type: entity
title: "backends/heartmula.py (HeartMuLa backend)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/heartmula.py"
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
  - "services/audio-engine/vbm_engine/backends/heartmula.py"
---

# backends/heartmula.py (HeartMuLa backend)

## Overview

HeartMuLa backend via `heartlib` (Apache-2.0) at a pinned commit; text2music only, up to 240 s (`services/audio-engine/vbm_engine/backends/heartmula.py:1-11`, `services/audio-engine/vbm_engine/backends/heartmula.py:31-36`).

## Signature / Definition

```py
HF_DOWNLOADS = ((HeartMuLa/HeartMuLaGen, ""), (HeartMuLa/HeartMuLa-oss-3B-happy-new-year, HeartMuLa-oss-3B), (HeartMuLa/HeartCodec-oss-20260123, HeartCodec-oss)); MIN_CUDA_GB = 16.0
class HeartMuLaBackend(cache_dir): id=heartmula, license=Apache-2.0, commercial=True
```

## Behavior

- `HF_DOWNLOADS` is a module constant listing three Hugging Face repos, not an environment variable (`services/audio-engine/vbm_engine/backends/heartmula.py:23-27`); `download` snapshots each (`services/audio-engine/vbm_engine/backends/heartmula.py:54-60`).
- Readiness needs `heartlib`, four checkpoint paths and 16 GB CUDA (`services/audio-engine/vbm_engine/backends/heartmula.py:43-52`).
- Pipeline loads once under a lock, bf16 on CUDA else float32 (`services/audio-engine/vbm_engine/backends/heartmula.py:62-77`); generation seeds torch and accepts options `topk`, `temperature`, `cfg_scale` (`services/audio-engine/vbm_engine/backends/heartmula.py:79-97`).

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

- `services/audio-engine/vbm_engine/backends/heartmula.py`
