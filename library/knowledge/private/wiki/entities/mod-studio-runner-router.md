---
type: entity
title: "studio/runners/router.ts (runner fallback policy)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/router.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-studio-runner-models]]"
used_by:
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/test-studio-router]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-router]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/router.ts"
---

# studio/runners/router.ts (runner fallback policy)

## Overview

Decides which runner takes a model and falls back only when nothing was created, so a job is never paid for twice.

## Signature / Definition

```ts
export type HealthCache = { read?: Promise<EngineHealth> }
export function sharedHealth(engine, cache): Promise<EngineHealth>
export interface RunnerKeys; export interface RunnerAttempt
export async function runnerUnavailable(runner, keys, cache?): Promise<string | null>
export class NoRunner extends ProviderError
export async function route<T>(model, keys, submit, only?): Promise<Routed<T>>
export function replicateRefusal(error: unknown): unknown
```

## Behavior

- `sharedHealth` memoises one health promise per cache, sharing failures too (`apps/ttb-studio/src/lib/server/studio/runners/router.ts:6-10`).
- `runnerUnavailable` reports pending runners, missing keys or engine readiness (`apps/ttb-studio/src/lib/server/studio/runners/router.ts:31-46`).
- `route` tries runners in order, records every attempt, rethrows any non-`RunnerRefused` error, and throws `NoRunner` (503 or the last refusal status) (`apps/ttb-studio/src/lib/server/studio/runners/router.ts:55-67`, `apps/ttb-studio/src/lib/server/studio/runners/router.ts:74-112`).
- `replicateRefusal` converts only `replicate create failed` errors or a detail-less 429 (`apps/ttb-studio/src/lib/server/studio/runners/router.ts:118-126`).

## Connections

- **depends_on:** [[entities/mod-contracts-engine]], [[entities/mod-music-errors]], [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-models]]
- **used_by:** [[entities/mod-studio-edit]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-runner-routed]], [[entities/test-studio-router]]
- **related:** [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-router]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/router.ts`
