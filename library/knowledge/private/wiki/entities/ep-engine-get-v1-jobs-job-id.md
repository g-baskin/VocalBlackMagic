---
type: entity
title: "engine GET /v1/jobs/{job_id}"
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
route_method: GET
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

# engine GET /v1/jobs/{job_id}

## Overview

Returns a job's status, stage, progress, error and output (`services/audio-engine/vbm_engine/app.py:231-238`).

## Signature / Definition

```py
@app.get("/v1/jobs/{job_id}")
```

## Behavior

- Auth, then id pattern check; unknown or malformed ids answer 404 `not_found` (`services/audio-engine/vbm_engine/app.py:133-135`, `services/audio-engine/vbm_engine/app.py:233-238`).
- Internal `_` fields are stripped (`services/audio-engine/vbm_engine/jobs.py:276-278`).

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
