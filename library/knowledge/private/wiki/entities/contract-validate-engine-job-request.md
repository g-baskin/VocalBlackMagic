---
type: entity
title: "validateEngineJobRequest"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/engine.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/contract-engine-job-request]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/test-contracts-engine]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-contracts-engine]]"
tags:
  - entity
  - function
  - contract
  - engine-protocol
related:
  - "[[entities/mod-engine-validation]]"
  - "[[concepts/contracts-engine-protocol-parity]]"
sources:
  - "packages/contracts/src/engine.ts"
---

# validateEngineJobRequest

## Overview

Shared request validation; the doc comment says the Python engine applies the same rules (`packages/contracts/src/engine.ts:124-181`).

## Signature / Definition

```ts
export function validateEngineJobRequest(body: unknown): string | null
```

## Behavior

- Order of checks: object, model, task, prompt 1 to 2000 non-blank, seed non-negative integer, instrumental boolean, lyrics up to 6000, duration 5 to 600 (`packages/contracts/src/engine.ts:126-142`).
- extend/repaint/cover need `source_audio` with format wav, flac or mp3 (`packages/contracts/src/engine.ts:143-149`).
- repaint needs `0 <= start < end` (`packages/contracts/src/engine.ts:150-160`); extend needs positive total of at most 240 s (`packages/contracts/src/engine.ts:161-174`); cover strength 0 to 1 (`packages/contracts/src/engine.ts:175-179`).
- The Studio runner validates before submitting, so invalid jobs never reach the GPU (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:105`).
- Parity evidence: the same 50-case fixture runs here (`packages/contracts/src/engine.test.ts:12-22`) and against Python `validate_engine_job_request` (`services/audio-engine/vbm_engine/validation.py:32`, `services/audio-engine/tests/test_validation_parity.py:15-22`). I did not run either test.

## Connections

- **depends_on:** [[entities/mod-contracts-engine]], [[entities/contract-engine-job-request]]
- **used_by:** [[entities/mod-studio-runner-engine]], [[entities/test-contracts-engine]]
- **related:** [[entities/mod-engine-validation]], [[concepts/contracts-engine-protocol-parity]]

## Tested by

- [[entities/test-contracts-engine]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/engine.ts`
