---
type: entity
title: "VBM_ENGINE_TOKEN"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/app.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-ttb-studio-env]]"
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-main]]"
  - "[[entities/mod-engine-modal-app]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/env-vbm-engine-url]]"
  - "[[concepts/engine-deployment-targets]]"
sources:
  - "services/audio-engine/vbm_engine/app.py"
  - "apps/ttb-studio/src/env.ts"
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
  - ".env.example"
---

# VBM_ENGINE_TOKEN

## Overview

Shared bearer token: the engine requires it to start and on every non-health route; TTB Studio sends it (`services/audio-engine/vbm_engine/app.py:49`, `apps/ttb-studio/src/env.ts:19-22`).

## Signature / Definition

```text
VBM_ENGINE_TOKEN
```

## Behavior

- Readers: engine `services/audio-engine/vbm_engine/app.py:49`, `:104-105`, `:137-144`; `services/audio-engine/vbm_engine/__main__.py:30-35`; Modal secret `vbm-engine-token` (`services/audio-engine/modal_app.py:91`); studio `apps/ttb-studio/src/env.ts:19-22`, `apps/ttb-studio/src/lib/server/studio/context.ts:9`, `:43`.
- Default: empty; the engine refuses to start (exit 2 or `ValueError`). Placeholder `.env.example:17`.
- Validation: engine compares with `hmac.compare_digest`; no length or entropy check. The Modal docstring suggests `openssl rand -hex 32` (`services/audio-engine/modal_app.py:6`).
- Secrecy: secret. Never commit it; the Studio keeps it server side.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-studio-context]], [[entities/mod-engine-app]], [[entities/mod-engine-main]], [[entities/mod-engine-modal-app]]
- **related:** [[entities/env-vbm-engine-url]], [[concepts/engine-deployment-targets]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/app.py`
- `apps/ttb-studio/src/env.ts`
- `apps/ttb-studio/src/lib/server/studio/context.ts`
- `.env.example`
