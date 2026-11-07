---
type: entity
title: "EngineJob"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/engine.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - engine-protocol
related:
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/ep-engine-get-v1-jobs-job-id]]"
  - "[[entities/ep-engine-delete-v1-jobs-job-id]]"
sources:
  - "packages/contracts/src/engine.ts"
---

# EngineJob

## Overview

Job object returned by `POST /v1/jobs` (202), `GET /v1/jobs/{id}` and `DELETE /v1/jobs/{id}` (`packages/contracts/src/engine.ts:88-100`).

## Signature / Definition

```ts
interface EngineJob { id; status: EngineJobStatus; model; task; created_at; progress?; stage?; error?; output?: EngineJobOutput }
interface EngineJobOutput { audio_url; format; duration_seconds; sample_rate; seed }
```

## Behavior

- `output.audio_url` is relative to the engine and fetched with Bearer auth (`packages/contracts/src/engine.ts:79-86`); the engine serves it at `services/audio-engine/vbm_engine/app.py:240`.
- `progress` is 0 to 1 when the backend can report it (`packages/contracts/src/engine.ts:95-96`).
- The Studio rejects a returned job whose id fails `engineJobIdPattern` (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:125`).

## Connections

- **depends_on:** [[entities/mod-contracts-engine]]
- **used_by:** [[entities/mod-studio-runner-engine]]
- **related:** [[entities/ep-engine-post-v1-jobs]], [[entities/ep-engine-get-v1-jobs-job-id]], [[entities/ep-engine-delete-v1-jobs-job-id]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/engine.ts`
