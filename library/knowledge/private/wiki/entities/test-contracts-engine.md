---
type: entity
title: "contracts engine.test.ts (fixture-driven)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/engine.test.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/contract-validate-engine-job-request]]"
used_by: []
last_commit_hash: "09057ad"
tested_by: []
tags:
  - entity
  - module
  - test
related:
  - "[[entities/mod-engine-validation]]"
  - "[[concepts/contracts-engine-protocol-parity]]"
sources:
  - "packages/contracts/src/engine.test.ts"
  - "packages/contracts/fixtures/engine-requests.json"
  - "services/audio-engine/tests/test_validation_parity.py"
---

# contracts engine.test.ts (fixture-driven)

## Overview

Runs every case of the shared fixture `packages/contracts/fixtures/engine-requests.json` through `validateEngineJobRequest` (`packages/contracts/src/engine.test.ts:1-22`).

## Signature / Definition

```ts
for (const c of fixtures.cases) test(`engine request: ${c.name}`, ...)
```

## Behavior

- Optional `pad` expands a field to N repetitions of a character before validation, so long-input limits need no huge literals (`packages/contracts/src/engine.test.ts:14-19`).
- Asserts the exact reason string or null (`packages/contracts/src/engine.test.ts:20`). The fixture holds 50 cases (counted at HEAD) and describes itself as shared with the Python validator (`packages/contracts/fixtures/engine-requests.json:2`).
- Twin: `services/audio-engine/tests/test_validation_parity.py:11-22` loads the same file and asserts `validate_engine_job_request(body) == case["expected"]`.

## Connections

- **depends_on:** [[entities/mod-contracts-engine]], [[entities/contract-validate-engine-job-request]]
- **used_by:** no importer or caller found in source
- **related:** [[entities/mod-engine-validation]], [[concepts/contracts-engine-protocol-parity]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/engine.test.ts`
- `packages/contracts/fixtures/engine-requests.json`
- `services/audio-engine/tests/test_validation_parity.py`
