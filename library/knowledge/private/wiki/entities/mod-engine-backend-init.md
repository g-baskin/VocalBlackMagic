---
type: entity
title: "vbm_engine/backends/__init__.py (backend registry)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/__init__.py"
language: py
depends_on:
  - "[[entities/mod-engine-backend-ace-step]]"
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/mod-engine-backend-diffrhythm]]"
  - "[[entities/mod-engine-backend-heartmula]]"
  - "[[entities/mod-engine-backend-yue2]]"
used_by:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-download]]"
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
  - "services/audio-engine/vbm_engine/backends/__init__.py"
---

# vbm_engine/backends/__init__.py (backend registry)

## Overview

Registry of the four production backends; test backends cannot be selected through configuration (`services/audio-engine/vbm_engine/backends/__init__.py:1-2`).

## Signature / Definition

```py
DOWNLOAD_GB = {ace-step-1.5: 10.0, heartmula: 16.0, diffrhythm-2: 6.0, yue2: 16.0}
def default_backends(cache_dir: Path) -> dict[str, Backend]
```

## Behavior

- Download size estimates used by the free-space check (`services/audio-engine/vbm_engine/backends/__init__.py:14-20`).
- `default_backends` instantiates ACE-Step, HeartMuLa, DiffRhythm 2 and YuE2 keyed by id (`services/audio-engine/vbm_engine/backends/__init__.py:23-30`).

## Connections

- **depends_on:** [[entities/mod-engine-backend-ace-step]], [[entities/mod-engine-backend-base]], [[entities/mod-engine-backend-diffrhythm]], [[entities/mod-engine-backend-heartmula]], [[entities/mod-engine-backend-yue2]]
- **used_by:** [[entities/mod-engine-app]], [[entities/mod-engine-download]]
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- [[entities/test-engine-backends]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/__init__.py`
