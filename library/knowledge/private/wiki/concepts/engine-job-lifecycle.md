---
type: concept
title: "Engine job lifecycle"
complexity: intermediate
domain: "vocal-black-magic"
aliases: []
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - engine
related:
  - "[[entities/mod-engine-jobs]]"
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/ep-engine-delete-v1-jobs-job-id]]"
  - "[[entities/test-engine-protocol]]"
sources:
  - "services/audio-engine/vbm_engine/jobs.py"
---

# Engine job lifecycle

## Definition

How a VBM Engine job moves from `queued` to `succeeded`, `failed` or `cancelled`, and what survives a restart.

## How it works

- `POST /v1/jobs` validates and queues; the record is saved atomically (`services/audio-engine/vbm_engine/jobs.py:111-147`).
- A slot thread marks it `running` and calls the backend with a `JobContext` (`services/audio-engine/vbm_engine/jobs.py:195-229`).
- Output is decoded and measured; success is committed under the lock so a late cancel wins (`services/audio-engine/vbm_engine/jobs.py:232-258`).
- Failures and cancels delete outputs (`services/audio-engine/vbm_engine/jobs.py:259-273`).
- On restart, unfinished jobs become `failed` (`services/audio-engine/vbm_engine/jobs.py:90-96`).

## Related

- [[entities/mod-engine-jobs]]
- [[entities/ep-engine-post-v1-jobs]]
- [[entities/ep-engine-delete-v1-jobs-job-id]]
- [[entities/test-engine-protocol]]
