---
type: entity
title: "VBM_ACESTEP_LM_BACKEND"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/ace_step.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-backend-ace-step]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related: []
sources:
  - "services/audio-engine/vbm_engine/backends/ace_step.py"
---

# VBM_ACESTEP_LM_BACKEND

## Overview

ACE-Step LM backend passed to upstream `LLMHandler.initialize` (`services/audio-engine/vbm_engine/backends/ace_step.py:96-101`).

## Signature / Definition

```text
VBM_ACESTEP_LM_BACKEND
```

## Behavior

- Readers: `services/audio-engine/vbm_engine/backends/ace_step.py:100`.
- Default: `pt`; `vllm` opts in (comment `services/audio-engine/vbm_engine/backends/ace_step.py:98-99`).
- Validation: none in this repo; upstream decides.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-backend-ace-step]]
- **related:** none found in source

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/ace_step.py`
