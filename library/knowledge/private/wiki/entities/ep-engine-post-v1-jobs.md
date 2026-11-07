---
type: entity
title: "engine POST /v1/jobs"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/app.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-validation]]"
  - "[[entities/mod-engine-jobs]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
route_method: POST
route_path: "/v1/jobs"
tags:
  - "entity"
  - "function"
  - "engine"
  - "python-endpoint"
related:
  - "[[concepts/engine-job-lifecycle]]"
  - "[[concepts/engine-validation-parity]]"
sources:
  - "services/audio-engine/vbm_engine/app.py"
  - "docs/ENGINE_PROTOCOL.md"
---

# engine POST /v1/jobs

## Overview

Queues a generation job and answers 202 with the public job view (`services/audio-engine/vbm_engine/app.py:176-229`).

## Signature / Definition

```py
@app.post("/v1/jobs")
```

## Behavior

- Auth first, then an `Idempotency-Key` header (trimmed, max 200 chars) returns the existing job without re-reading the body (`services/audio-engine/vbm_engine/app.py:178-184`).
- 413 `too_large` for an over-limit Content-Length or body (`services/audio-engine/vbm_engine/app.py:185-190`); 422 for non-JSON or validator failures (`services/audio-engine/vbm_engine/app.py:191-197`).
- 503 `model_not_ready` for an absent or unready backend; 422 `unsupported_task` (`services/audio-engine/vbm_engine/app.py:199-208`).
- Edit tasks decode base64 strictly, 50 MiB cap, else 413/422 (`services/audio-engine/vbm_engine/app.py:209-223`); a full queue gives 429 `queue_full` (`services/audio-engine/vbm_engine/app.py:224-229`).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/mod-engine-validation]], [[entities/mod-engine-jobs]]
- **used_by:** [[entities/mod-studio-runner-engine]]
- **related:** [[concepts/engine-job-lifecycle]], [[concepts/engine-validation-parity]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/app.py`
- `docs/ENGINE_PROTOCOL.md`
