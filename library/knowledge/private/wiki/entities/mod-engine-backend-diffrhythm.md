---
type: entity
title: "backends/diffrhythm.py (DiffRhythm 2 backend)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/diffrhythm.py"
language: py
depends_on:
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/mod-engine-backend-common]]"
  - "[[entities/env-hf-home]]"
  - "[[entities/env-hf-hub-cache]]"
  - "[[entities/env-cuda-visible-devices]]"
  - "[[entities/ext-github-com]]"
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
  - "services/audio-engine/vbm_engine/backends/diffrhythm.py"
---

# backends/diffrhythm.py (DiffRhythm 2 backend)

## Overview

DiffRhythm 2 (Apache-2.0) backend that runs the upstream `inference.py` as a subprocess; text2music only (`services/audio-engine/vbm_engine/backends/diffrhythm.py:1-12`, `services/audio-engine/vbm_engine/backends/diffrhythm.py:32-37`).

## Signature / Definition

```py
UPSTREAM_REPO = "https://github.com/ASLP-lab/DiffRhythm2"; UPSTREAM_COMMIT; HF_REPO = "ASLP-lab/DiffRhythm2"; MIN_CUDA_GB = 12.0
class DiffRhythm2Backend(cache_dir): id=diffrhythm-2, license=Apache-2.0, commercial=True, tasks=(text2music,), max_duration_seconds=210
```

## Behavior

- Readiness needs `src/inference.py`, `espeak-ng` on PATH, then the shared check with `hf/` as the weights path (`services/audio-engine/vbm_engine/backends/diffrhythm.py:44-60`).
- `download` git-clones the upstream repo, checks out the pinned commit and snapshots HF weights into `hf/` (`services/audio-engine/vbm_engine/backends/diffrhythm.py:62-69`).
- `generate` writes an `.lrc` and a JSONL row, passes only absolute paths, and sets `PYTHONPATH`, `HF_HOME`, `HF_HUB_CACHE` and `CUDA_VISIBLE_DEVICES` for the child (`services/audio-engine/vbm_engine/backends/diffrhythm.py:71-106`).
- Cancel is polled every second and terminates the subprocess; non-zero exit raises; output is `dr2/song.mp3` (`services/audio-engine/vbm_engine/backends/diffrhythm.py:108-118`).
- `CUDA_VISIBLE_DEVICES` is inherited (default `0`) on CUDA and blanked otherwise (`services/audio-engine/vbm_engine/backends/diffrhythm.py:127-130`).

## Connections

- **depends_on:** [[entities/mod-engine-backend-base]], [[entities/mod-engine-backend-common]], [[entities/env-hf-home]], [[entities/env-hf-hub-cache]], [[entities/env-cuda-visible-devices]], [[entities/ext-github-com]], [[entities/ext-huggingface-co]]
- **used_by:** [[entities/mod-engine-backend-init]]
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- [[entities/test-engine-backends]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/diffrhythm.py`
