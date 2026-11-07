---
type: entity
title: "github.com"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/diffrhythm.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-backend-diffrhythm]]"
  - "[[entities/engine-install-ace-step]]"
  - "[[entities/engine-requirements-heartmula]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "build"
related: []
sources:
  - "services/audio-engine/vbm_engine/backends/diffrhythm.py"
  - "services/audio-engine/install-ace-step.sh"
---

# github.com

## Overview

Source host for pinned upstream model code (`services/audio-engine/vbm_engine/backends/diffrhythm.py:26`).

## Signature / Definition

```text
https://github.com
```

## Behavior

- Kind: Real network target at install, build or download time, not during request handling.
- Caller: `git clone` of DiffRhythm2 in `download` (`services/audio-engine/vbm_engine/backends/diffrhythm.py:62-66`)
- Caller: ACE-Step clone in `services/audio-engine/install-ace-step.sh:10`
- Caller: heartlib pip git dependency (`services/audio-engine/requirements-heartmula.txt:2`)
- Caller: docstring references only: `services/audio-engine/vbm_engine/backends/ace_step.py:3`, `services/audio-engine/vbm_engine/backends/heartmula.py:3`

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-backend-diffrhythm]], [[entities/engine-install-ace-step]], [[entities/engine-requirements-heartmula]]
- **related:** none found in source

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/diffrhythm.py`
- `services/audio-engine/install-ace-step.sh`
