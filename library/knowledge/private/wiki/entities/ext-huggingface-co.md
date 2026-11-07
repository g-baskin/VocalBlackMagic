---
type: entity
title: "huggingface.co"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/ace_step.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-backend-ace-step]]"
  - "[[entities/mod-engine-backend-heartmula]]"
  - "[[entities/mod-engine-backend-diffrhythm]]"
  - "[[entities/mod-engine-backend-yue2]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "build"
related:
  - "[[entities/env-hf-home]]"
sources:
  - "services/audio-engine/vbm_engine/backends/ace_step.py"
---

# huggingface.co

## Overview

Model weight host reached through `huggingface_hub.snapshot_download`; the hostname is the library default and does not appear in repo source (unverified).

## Signature / Definition

```text
https://huggingface.co
```

## Behavior

- Kind: Real network target at install, build or download time, not during request handling.
- Caller: `services/audio-engine/vbm_engine/backends/ace_step.py:76-80`
- Caller: `services/audio-engine/vbm_engine/backends/heartmula.py:54-60`
- Caller: `services/audio-engine/vbm_engine/backends/diffrhythm.py:67-69`
- Caller: `services/audio-engine/vbm_engine/backends/yue2.py:52-56`

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-backend-ace-step]], [[entities/mod-engine-backend-heartmula]], [[entities/mod-engine-backend-diffrhythm]], [[entities/mod-engine-backend-yue2]]
- **related:** [[entities/env-hf-home]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/ace_step.py`
