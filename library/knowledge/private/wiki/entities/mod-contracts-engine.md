---
type: entity
title: "contracts engine.ts (VBM Engine protocol v1)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/engine.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-studio-runner-router]]"
  - "[[entities/mod-studio-runner-models]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/test-contracts-engine]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-contracts-engine]]"
tags:
  - entity
  - module
  - package
  - contract
  - engine-protocol
related:
  - "[[entities/contract-engine-protocol-version]]"
  - "[[entities/contract-engine-job-request]]"
  - "[[entities/contract-engine-job]]"
  - "[[entities/contract-engine-health]]"
  - "[[entities/contract-validate-engine-job-request]]"
  - "[[entities/mod-engine-validation]]"
  - "[[concepts/contracts-engine-protocol-parity]]"
sources:
  - "packages/contracts/src/engine.ts"
---

# contracts engine.ts (VBM Engine protocol v1)

## Overview

TypeScript side of the HTTP contract between TTB Studio and the self-hosted engine in `services/audio-engine`; the header says the Python worker mirrors these shapes and both must change together with a version bump (`packages/contracts/src/engine.ts:1-6`).

## Signature / Definition

```ts
export const ENGINE_PROTOCOL_VERSION = 1
export const engineModelIds = ['ace-step-1.5','heartmula','diffrhythm-2','yue2'] as const
export const engineTasks = ['text2music','extend','repaint','cover'] as const
export type EngineJobStatus, EngineDevice, EngineAudioFormat
export interface EngineModelInfo, EngineHealth, EngineSourceAudio, EngineJobRequest, EngineJobOutput, EngineJob, EngineError
export const engineJobIdPattern = /^[A-Za-z0-9_-]{1,80}$/
export function validateEngineJobRequest(body: unknown): string | null
```

## Behavior

- Model ids and tasks are closed lists (`packages/contracts/src/engine.ts:9-14`); job statuses are `queued`, `running`, `succeeded`, `failed`, `cancelled` (`packages/contracts/src/engine.ts:16`); devices `cuda`/`mps`/`cpu`; formats `wav`/`flac`/`mp3` (`packages/contracts/src/engine.ts:17-18`).
- `EngineModelInfo` carries licence, `commercial`, `installed`, `ready`, supported tasks and max duration (`packages/contracts/src/engine.ts:20-34`).
- `EngineError.code` is one of eight codes from `unauthorized` to `internal` (`packages/contracts/src/engine.ts:103-114`).
- `engineJobIdPattern` gates ids the Studio accepts (`packages/contracts/src/engine.ts:119`); the runner checks it before polling or cancelling (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:125`, `apps/ttb-studio/src/lib/server/studio/runners/engine.ts:133`, `apps/ttb-studio/src/lib/server/studio/runners/engine.ts:143`).
- Importers: `apps/ttb-studio/src/lib/server/studio/runners/engine.ts:6-13`, `apps/ttb-studio/src/lib/server/studio/runners/router.ts:2`, `apps/ttb-studio/src/lib/server/studio/runners/models.ts:6`, `apps/ttb-studio/src/lib/server/studio/edit.ts:20-22`.

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-router]], [[entities/mod-studio-runner-models]], [[entities/mod-studio-edit]], [[entities/mod-contracts]], [[entities/test-contracts-engine]]
- **related:** [[entities/contract-engine-protocol-version]], [[entities/contract-engine-job-request]], [[entities/contract-engine-job]], [[entities/contract-engine-health]], [[entities/contract-validate-engine-job-request]], [[entities/mod-engine-validation]], [[concepts/contracts-engine-protocol-parity]]

## Tested by

- [[entities/test-contracts-engine]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/engine.ts`
