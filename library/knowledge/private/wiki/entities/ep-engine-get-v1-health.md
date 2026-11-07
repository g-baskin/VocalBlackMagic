---
type: entity
title: "engine GET /v1/health"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/app.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-jobs]]"
  - "[[entities/mod-engine-backend-base]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
route_method: GET
route_path: "/v1/health"
tags:
  - "entity"
  - "function"
  - "engine"
  - "python-endpoint"
related:
  - "[[concepts/engine-job-lifecycle]]"
  - "[[concepts/engine-model-readiness]]"
  - "[[questions/engine-health-unauthenticated-disclosure]]"
sources:
  - "services/audio-engine/vbm_engine/app.py"
  - "docs/ENGINE_PROTOCOL.md"
---

# engine GET /v1/health

## Overview

Public health route reporting protocol, version, device, slot and queue counts, and per-model readiness (`services/audio-engine/vbm_engine/app.py:161-174`).

## Signature / Definition

```py
@app.get("/v1/health")
```

## Behavior

- No bearer auth (`services/audio-engine/vbm_engine/app.py:161-174`), as the protocol states (`docs/ENGINE_PROTOCOL.md:8`); the localhost Host guard still applies (`services/audio-engine/vbm_engine/app.py:108-114`).
- Each model reports id, license, commercial, installed, `ready = installed and ready`, tasks, max duration and an optional plain-words `reason` (`services/audio-engine/vbm_engine/app.py:146-159`); models are listed in `MODEL_IDS` order (`services/audio-engine/vbm_engine/app.py:164`).
- Studio probes it before queueing (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:67-69`). Dockerfile healthcheck calls it with `Host: localhost` (`services/audio-engine/Dockerfile:51-52`).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/mod-engine-jobs]], [[entities/mod-engine-backend-base]]
- **used_by:** [[entities/mod-studio-runner-engine]]
- **related:** [[concepts/engine-job-lifecycle]], [[concepts/engine-model-readiness]], [[questions/engine-health-unauthenticated-disclosure]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/app.py`
- `docs/ENGINE_PROTOCOL.md`
