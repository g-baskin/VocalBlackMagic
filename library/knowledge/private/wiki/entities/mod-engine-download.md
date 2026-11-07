---
type: entity
title: "vbm_engine/download.py (weights downloader)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/download.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-backend-init]]"
  - "[[entities/env-vbm-engine-cache]]"
used_by:
  - "[[entities/mod-engine-modal-app]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-backends]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-deployment-targets]]"
  - "[[entities/ext-huggingface-co]]"
  - "[[entities/ext-github-com]]"
sources:
  - "services/audio-engine/vbm_engine/download.py"
---

# vbm_engine/download.py (weights downloader)

## Overview

CLI `python -m vbm_engine.download <model>` that downloads a model's weights into `VBM_ENGINE_CACHE` after a free-disk check (`services/audio-engine/vbm_engine/download.py:1-4`, `services/audio-engine/vbm_engine/download.py:26-47`).

## Signature / Definition

```py
MARGIN_GB = 5.0
def free_gb(path: Path) -> float
def main(argv: list[str] | None = None) -> int
```

## Behavior

- Model choices are the keys of `DOWNLOAD_GB` (`services/audio-engine/vbm_engine/download.py:28`, `services/audio-engine/vbm_engine/backends/__init__.py:15-20`).
- Needs the model's estimate plus 5 GB free at the cache (walking up to an existing parent), else exit 3 (`services/audio-engine/vbm_engine/download.py:16-23`, `services/audio-engine/vbm_engine/download.py:30-39`).
- Exit 2 when the backend has no `download` method; otherwise calls it (`services/audio-engine/vbm_engine/download.py:40-47`). Downloads reach external hosts (see [[entities/ext-huggingface-co]], [[entities/ext-github-com]]).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/mod-engine-backend-init]], [[entities/env-vbm-engine-cache]]
- **used_by:** [[entities/mod-engine-modal-app]]
- **related:** [[concepts/engine-deployment-targets]], [[entities/ext-huggingface-co]], [[entities/ext-github-com]]

## Tested by

- [[entities/test-engine-backends]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/download.py`
