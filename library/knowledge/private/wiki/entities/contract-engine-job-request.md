---
type: entity
title: "EngineJobRequest"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/engine.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
used_by:
  - "[[entities/contract-validate-engine-job-request]]"
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-contracts-engine]]"
tags:
  - entity
  - data-model
  - contract
  - engine-protocol
related:
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/contract-edit-request]]"
sources:
  - "packages/contracts/src/engine.ts"
---

# EngineJobRequest

## Overview

Body of `POST /v1/jobs` (Bearer auth, optional `Idempotency-Key`) (`packages/contracts/src/engine.ts:55-77`).

## Signature / Definition

```ts
interface EngineJobRequest { model: EngineModelId; task: EngineTask; prompt; lyrics?; instrumental?; duration_seconds?; seed?; source_audio?: EngineSourceAudio; repaint?: { start_seconds; end_seconds }; extend?: { before_seconds?; after_seconds? }; cover?: { strength }; options?: Record<string, number | string | boolean> }
```

## Behavior

- Documented ranges: prompt 1 to 2000, lyrics up to 6000, duration 5 to 600 s clamped to the model max (`packages/contracts/src/engine.ts:59-65`).
- `source_audio` is base64 without a `data:` prefix and the engine rejects over 50 MiB decoded (`packages/contracts/src/engine.ts:49-53`); required for extend, repaint and cover (`packages/contracts/src/engine.ts:67-68`).
- Unknown `options` keys are ignored (`packages/contracts/src/engine.ts:75-76`). Handled by `services/audio-engine/vbm_engine/app.py:176`.

## Connections

- **depends_on:** [[entities/mod-contracts-engine]]
- **used_by:** [[entities/contract-validate-engine-job-request]], [[entities/mod-studio-runner-engine]]
- **related:** [[entities/ep-engine-post-v1-jobs]], [[entities/contract-edit-request]]

## Tested by

- [[entities/test-contracts-engine]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/engine.ts`
