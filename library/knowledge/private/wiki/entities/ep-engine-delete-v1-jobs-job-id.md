---
type: entity
title: "engine DELETE /v1/jobs/{job_id}"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/app.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-jobs]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
route_method: DELETE
route_path: "/v1/jobs/{job_id}"
tags:
  - "entity"
  - "function"
  - "engine"
  - "python-endpoint"
related:
  - "[[concepts/engine-job-lifecycle]]"
sources:
  - "services/audio-engine/vbm_engine/app.py"
  - "docs/ENGINE_PROTOCOL.md"
---

# engine DELETE /v1/jobs/{job_id}

## Overview

Cancels a queued or running job; idempotent (`services/audio-engine/vbm_engine/app.py:250-257`, `docs/ENGINE_PROTOCOL.md:21`).

## Signature / Definition

```py
@app.delete("/v1/jobs/{job_id}")
```

## Behavior

- Queued jobs become `cancelled` at once; running jobs get stage `cancelling` and stop at the next checkpoint; terminal jobs return unchanged (`services/audio-engine/vbm_engine/jobs.py:161-175`).
- Unknown ids answer 404 (`services/audio-engine/vbm_engine/app.py:254-256`).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/mod-engine-jobs]]
- **used_by:** [[entities/mod-studio-runner-engine]]
- **related:** [[concepts/engine-job-lifecycle]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/app.py`
- `docs/ENGINE_PROTOCOL.md`
