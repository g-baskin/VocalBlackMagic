---
type: concept
title: "Engine protocol parity (TS and Python)"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "VBM Engine protocol v1"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "packages/contracts/src/engine.ts"
  - "packages/contracts/fixtures/engine-requests.json"
  - "services/audio-engine/tests/test_validation_parity.py"
---

# Engine protocol parity (TS and Python)

## Definition

The self-hosted engine contract is defined twice: in TypeScript for TTB Studio and in Python for the worker. A shared fixture keeps the two request validators in agreement.

## How it works

- `packages/contracts/src/engine.ts:1-6` declares protocol v1 and requires both sides to change together with a version bump.
- 50 cases in `packages/contracts/fixtures/engine-requests.json` run through `validateEngineJobRequest` (`packages/contracts/src/engine.test.ts:12-22`) and through Python `validate_engine_job_request` (`services/audio-engine/tests/test_validation_parity.py:11-22`); both assert the exact reason string.
- The Studio refuses an engine reporting another protocol version (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:75`).

## Why it matters

A request the Studio accepts but the engine rejects (or the reverse) would waste GPU time or surface confusing errors; identical reason strings let the UI show the engine's words.

## Examples in this codebase

- [[entities/contract-validate-engine-job-request]]
- [[entities/test-contracts-engine]]
- [[entities/mod-engine-validation]]

## Connections

- **involves entities:** [[entities/mod-contracts-engine]], [[entities/contract-engine-protocol-version]], [[entities/contract-engine-job-request]], [[entities/contract-engine-job]], [[entities/contract-engine-health]], [[entities/mod-studio-runner-engine]], [[entities/ep-engine-post-v1-jobs]], [[entities/ep-engine-get-v1-health]]
- **related concepts:** [[concepts/hosted-generation-flow]]

## Sources

- `packages/contracts/src/engine.ts`
- `packages/contracts/fixtures/engine-requests.json`
- `services/audio-engine/tests/test_validation_parity.py`
