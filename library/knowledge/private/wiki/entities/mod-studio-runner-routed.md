---
type: entity
title: "studio/runners/routed.ts (routed model submission)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/routed.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-runner-direct]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-studio-runner-models]]"
  - "[[entities/mod-studio-runner-router]]"
used_by:
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-runner-capabilities]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-review]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
  - "[[concepts/premium-studio]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/routed.ts"
---

# studio/runners/routed.ts (routed model submission)

## Overview

Submits takes for a chosen model through the router and returns queued tasks or synchronous audio plus a runner record.

## Signature / Definition

```ts
export interface RoutedDeps; export type Submitted = { tasks: JobTask[] } | { results: DirectResult[] }
export const modelCosts: Record<StudioModel, number>
export function routedKeys(deps: RoutedDeps): RunnerKeys
export function modelRequestError(model: ModelSpec, request: CreateSongRequest): string | null
export async function submitRouted(deps, modelId, input, takes): Promise<RoutedSubmission>
```

## Behavior

- Per-song estimates are not a billing guarantee (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:36-44`).
- Engine takes use `text2music` with a fresh idempotency key (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:74-87`); fal reuses `submitFal` with `premium_studio: false` and only `fal submit failed` errors refuse (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:88-113`); Replicate refusals go through `replicateRefusal` (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:114-125`).
- The first take is routed with fallback; later takes stay on the same runner and a failure stops further takes but keeps accepted ones (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:139-180`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-studio-replicate]], [[entities/mod-studio-jobs]], [[entities/mod-studio-runner-direct]], [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-models]], [[entities/mod-studio-runner-router]]
- **used_by:** [[entities/mod-studio-create]], [[entities/mod-studio-runner-capabilities]]
- **related:** [[concepts/studio-models-and-runners]], [[concepts/premium-studio]]

## Tested by

- [[entities/test-studio-review]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/routed.ts`
