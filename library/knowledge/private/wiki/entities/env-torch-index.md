---
type: entity
title: "TORCH_INDEX"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/install-ace-step.sh"
language: unknown
depends_on: []
used_by:
  - "[[entities/engine-install-ace-step]]"
  - "[[entities/engine-dockerfile]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/ext-download-pytorch-org]]"
sources:
  - "services/audio-engine/install-ace-step.sh"
  - "services/audio-engine/Dockerfile"
---

# TORCH_INDEX

## Overview

PyTorch wheel index used by the install script and Docker build (`services/audio-engine/install-ace-step.sh:9`).

## Signature / Definition

```text
TORCH_INDEX
```

## Behavior

- Readers: `services/audio-engine/install-ace-step.sh:9`, `:12-13`; Docker build arg passed to the script (`services/audio-engine/Dockerfile:11`, `:33`); `modal_app.py` uses a same-named constant, not the env var (`services/audio-engine/modal_app.py:51`).
- Default: `https://download.pytorch.org/whl/cu128`.
- Validation: none.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/engine-install-ace-step]], [[entities/engine-dockerfile]]
- **related:** [[entities/ext-download-pytorch-org]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/install-ace-step.sh`
- `services/audio-engine/Dockerfile`
