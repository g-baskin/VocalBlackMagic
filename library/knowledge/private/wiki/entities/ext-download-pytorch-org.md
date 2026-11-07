---
type: entity
title: "download.pytorch.org"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/modal_app.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-modal-app]]"
  - "[[entities/engine-dockerfile]]"
  - "[[entities/engine-install-ace-step]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "build"
related:
  - "[[entities/env-torch-index]]"
sources:
  - "services/audio-engine/modal_app.py"
---

# download.pytorch.org

## Overview

CUDA 12.8 PyTorch wheel index (`services/audio-engine/modal_app.py:51`).

## Signature / Definition

```text
https://download.pytorch.org
```

## Behavior

- Kind: Real network target at install, build or download time, not during request handling.
- Caller: Modal image pip installs (`services/audio-engine/modal_app.py:76`, `:78`)
- Caller: Dockerfile build arg (`services/audio-engine/Dockerfile:11`)
- Caller: install script default (`services/audio-engine/install-ace-step.sh:9`)

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-modal-app]], [[entities/engine-dockerfile]], [[entities/engine-install-ace-step]]
- **related:** [[entities/env-torch-index]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/modal_app.py`
