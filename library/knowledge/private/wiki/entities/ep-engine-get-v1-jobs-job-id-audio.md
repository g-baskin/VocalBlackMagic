---
type: entity
title: "engine GET /v1/jobs/{job_id}/audio"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/app.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-jobs]]"
  - "[[entities/mod-engine-audio]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
route_method: GET
route_path: "/v1/jobs/{job_id}/audio"
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

# engine GET /v1/jobs/{job_id}/audio

## Overview

Streams the finished output file with its content type (`services/audio-engine/vbm_engine/app.py:240-248`).

## Signature / Definition

```py
@app.get("/v1/jobs/{job_id}/audio")
```

## Behavior

- 404 unless the job succeeded and its `output.<fmt>` file exists (`services/audio-engine/vbm_engine/jobs.py:154-159`, `services/audio-engine/vbm_engine/app.py:244-246`).
- Media type from `CONTENT_TYPES`; download filename `<job_id>.<fmt>` (`services/audio-engine/vbm_engine/app.py:247-248`).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/mod-engine-jobs]], [[entities/mod-engine-audio]]
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
