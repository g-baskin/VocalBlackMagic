---
type: entity
title: "VBM_MODAL_SCALEDOWN"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/modal_app.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-modal-app]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[concepts/engine-deployment-targets]]"
sources:
  - "services/audio-engine/modal_app.py"
---

# VBM_MODAL_SCALEDOWN

## Overview

Modal deploy setting read at module import on the deploying machine (`services/audio-engine/modal_app.py:48`).

## Signature / Definition

```text
VBM_MODAL_SCALEDOWN
```

## Behavior

- Readers: `services/audio-engine/modal_app.py:48`.
- Default: `60` seconds.
- Validation: `int()` at import; used as `scaledown_window` (`services/audio-engine/modal_app.py:100`).
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-modal-app]]
- **related:** [[concepts/engine-deployment-targets]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/modal_app.py`
