---
type: entity
title: "EngineHealth"
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
  - "[[entities/mod-studio-runner-router]]"
  - "[[entities/mod-studio-edit]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - engine-protocol
related:
  - "[[entities/ep-engine-get-v1-health]]"
  - "[[entities/contract-engine-protocol-version]]"
sources:
  - "packages/contracts/src/engine.ts"
---

# EngineHealth

## Overview

Body of `GET /v1/health` (no auth): process and per-model readiness (`packages/contracts/src/engine.ts:36-47`).

## Signature / Definition

```ts
interface EngineHealth { ok; protocol: number; version; device: EngineDevice; concurrency; queued; running; models: EngineModelInfo[] }
```

## Behavior

- `concurrency` is the number of GPU slots that may run at once (`packages/contracts/src/engine.ts:42-43`); `models` lists `EngineModelInfo` with `ready` and a plain `reason` (`packages/contracts/src/engine.ts:20-34`).
- Served by the engine at `services/audio-engine/vbm_engine/app.py:161`; checked for protocol and models array at `apps/ttb-studio/src/lib/server/studio/runners/engine.ts:75`.

## Connections

- **depends_on:** [[entities/mod-contracts-engine]]
- **used_by:** [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-router]], [[entities/mod-studio-edit]]
- **related:** [[entities/ep-engine-get-v1-health]], [[entities/contract-engine-protocol-version]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/engine.ts`
