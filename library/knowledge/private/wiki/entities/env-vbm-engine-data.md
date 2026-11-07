---
type: entity
title: "VBM_ENGINE_DATA"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/app.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-jobs]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[concepts/engine-deployment-targets]]"
sources:
  - "services/audio-engine/vbm_engine/app.py"
---

# VBM_ENGINE_DATA

## Overview

Engine setting read by `Settings.from_env` (`services/audio-engine/vbm_engine/app.py:50`). Job records and outputs live here.

## Signature / Definition

```text
VBM_ENGINE_DATA
```

## Behavior

- Readers: `services/audio-engine/vbm_engine/app.py:50`.
- Default: `<service root>/data` (`services/audio-engine/vbm_engine/app.py:32`, `:50`); Dockerfile `/data` (`services/audio-engine/Dockerfile:19`); Modal `/cache/data` (`services/audio-engine/modal_app.py:82`).
- Validation: none; resolved to an absolute `jobs/` directory (`services/audio-engine/vbm_engine/jobs.py:46-47`).
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-app]], [[entities/mod-engine-jobs]]
- **related:** [[concepts/engine-deployment-targets]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/app.py`
