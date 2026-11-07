---
type: entity
title: "vbm_engine/jobs.py (JobManager)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/jobs.py"
language: py
depends_on:
  - "[[entities/mod-engine-audio]]"
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/env-vbm-engine-data]]"
used_by:
  - "[[entities/mod-engine-app]]"
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/ep-engine-get-v1-jobs-job-id]]"
  - "[[entities/ep-engine-get-v1-jobs-job-id-audio]]"
  - "[[entities/ep-engine-delete-v1-jobs-job-id]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-job-lifecycle]]"
sources:
  - "services/audio-engine/vbm_engine/jobs.py"
---

# vbm_engine/jobs.py (JobManager)

## Overview

In-process job queue with fixed worker threads (GPU slots), idempotency keys, cooperative cancellation and atomic on-disk JSON records under `VBM_ENGINE_DATA/jobs` (`services/audio-engine/vbm_engine/jobs.py:1-6`, `services/audio-engine/vbm_engine/jobs.py:35-68`).

## Signature / Definition

```py
class QueueFull(Exception)
class JobManager(data_dir, backends, device, concurrency=1, max_queue=16, clock=_now)
  counts() -> (queued, running); find_idempotent(key); submit(model, inp, key, source) -> (job, created)
  get(id); output_file(id) -> Path | None; cancel(id); shutdown()
def public_view(job) -> dict
```

## Behavior

- Concurrency is clamped to at least 1 and the queue limit to at least 0; one daemon thread per slot (`services/audio-engine/vbm_engine/jobs.py:50-51`, `services/audio-engine/vbm_engine/jobs.py:63-68`).
- Records are written via a `.tmp` file and `os.replace` (`services/audio-engine/vbm_engine/jobs.py:77-80`).
- On start, jobs left `queued` or `running` become `failed` with `interrupted by restart` because inputs are not persisted; idempotency keys are restored (`services/audio-engine/vbm_engine/jobs.py:82-99`).
- `submit` returns the existing job for a known key, raises `QueueFull` at the limit, writes source audio to `jobs/<id>/source.<fmt>`, and ids are `uuid4().hex` (`services/audio-engine/vbm_engine/jobs.py:111-147`).
- `cancel` removes a queued job immediately or flags a running one as `cancelling`; terminal jobs are returned unchanged (`services/audio-engine/vbm_engine/jobs.py:161-175`).
- `_run` measures the output, renames it `output.<fmt>`, and commits success under the lock so a cancel accepted during measurement wins (`services/audio-engine/vbm_engine/jobs.py:215-258`); failures and cancels delete `output.*` and never report output (`services/audio-engine/vbm_engine/jobs.py:259-273`). Backend errors are truncated to 500 characters (`services/audio-engine/vbm_engine/jobs.py:267`).
- `public_view` drops fields starting with `_` such as `_idempotency_key` and `_output_file` (`services/audio-engine/vbm_engine/jobs.py:276-278`).

## Connections

- **depends_on:** [[entities/mod-engine-audio]], [[entities/mod-engine-backend-base]], [[entities/env-vbm-engine-data]]
- **used_by:** [[entities/mod-engine-app]], [[entities/ep-engine-post-v1-jobs]], [[entities/ep-engine-get-v1-jobs-job-id]], [[entities/ep-engine-get-v1-jobs-job-id-audio]], [[entities/ep-engine-delete-v1-jobs-job-id]]
- **related:** [[concepts/engine-job-lifecycle]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/jobs.py`
