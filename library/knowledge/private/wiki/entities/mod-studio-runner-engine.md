---
type: entity
title: "studio/runners/engine.ts (self-hosted engine client, protocol v1)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/engine.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/ep-engine-get-v1-health]]"
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/ep-engine-get-v1-jobs-job-id]]"
  - "[[entities/ep-engine-delete-v1-jobs-job-id]]"
  - "[[entities/env-vbm-engine-url]]"
  - "[[entities/env-vbm-engine-token]]"
used_by:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-runner-direct]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/mod-studio-runner-router]]"
  - "[[entities/test-studio-engine]]"
  - "[[entities/test-studio-router]]"
  - "[[entities/test-studio-direct]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-studio-engine]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/engine.ts"
---

# studio/runners/engine.ts (self-hosted engine client, protocol v1)

## Overview

HTTP client for the self-hosted VBM audio engine, plus the `RunnerRefused` error that marks a safe-to-fall-back refusal.

## Signature / Definition

```ts
export interface EngineDeps { url: string; token: string; fetch: typeof fetch }
export class RunnerRefused extends ProviderError
export async function engineHealth(deps): Promise<EngineHealth>
export function engineModelReason(health, model): string | null
export async function submitEngineJob(deps, request, idempotencyKey): Promise<EngineJob>
export async function getEngineJob(deps, id): Promise<EngineJob>
export async function cancelEngineJob(deps, id): Promise<void>
export async function engineAudio(deps, job): Promise<Response>
```

## Behavior

- `RunnerRefused` means the engine refused before a job existed (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:28-33`).
- The base URL must be http(s), else 503 (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:37-42`); requests carry a Bearer token (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:48-50`); 401 maps to 502 and 404 to 404 (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:52-65`).
- `engineHealth` calls `GET /v1/health` unauthenticated with a 5 s timeout and requires the matching protocol version (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:68-85`).
- `submitEngineJob` validates the request, posts `/v1/jobs` with an `idempotency-key`, and turns HTTP failures into `RunnerRefused` (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:100-118`).
- Status and cancel use `/v1/jobs/<id>` (GET, DELETE; 404 on cancel is ignored) (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:132-150`).
- `engineAudio` refuses off-origin audio URLs, sends the token, disallows redirects and caps the body at 200 MiB (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:153-174`).

## Connections

- **depends_on:** [[entities/mod-contracts-engine]], [[entities/mod-music-errors]], [[entities/mod-studio-replicate]], [[entities/ep-engine-get-v1-health]], [[entities/ep-engine-post-v1-jobs]], [[entities/ep-engine-get-v1-jobs-job-id]], [[entities/ep-engine-delete-v1-jobs-job-id]], [[entities/env-vbm-engine-url]], [[entities/env-vbm-engine-token]]
- **used_by:** [[entities/mod-studio-context]], [[entities/mod-studio-create]], [[entities/mod-studio-jobs]], [[entities/mod-studio-edit]], [[entities/mod-studio-runner-direct]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-runner-router]], [[entities/test-studio-engine]], [[entities/test-studio-router]], [[entities/test-studio-direct]]
- **related:** [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-engine]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/engine.ts`
