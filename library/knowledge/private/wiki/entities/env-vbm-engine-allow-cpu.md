---
type: entity
title: "VBM_ENGINE_ALLOW_CPU"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/common.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-backend-common]]"
  - "[[entities/mod-engine-backend-ace-step]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[concepts/engine-model-readiness]]"
sources:
  - "services/audio-engine/vbm_engine/backends/common.py"
---

# VBM_ENGINE_ALLOW_CPU

## Overview

Opt-in for slow CPU runs; without it CPU backends report not ready (`services/audio-engine/vbm_engine/backends/common.py:11-12`, `:39-40`).

## Signature / Definition

```text
VBM_ENGINE_ALLOW_CPU
```

## Behavior

- Readers: `services/audio-engine/vbm_engine/backends/common.py:12`; `services/audio-engine/vbm_engine/backends/ace_step.py:72`, `:177-180`.
- Default: unset: off.
- Validation: true only for `1`, `true`, `yes` (case-insensitive).
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-backend-common]], [[entities/mod-engine-backend-ace-step]]
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/common.py`
