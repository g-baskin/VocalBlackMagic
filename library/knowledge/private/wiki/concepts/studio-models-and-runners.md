---
type: concept
title: "Studio models and runners"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "models x runners"
  - "runner fallback"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - studio
related:
  - "[[concepts/studio-job-lifecycle]]"
  - "[[concepts/studio-seance-blind-comparison]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/models.ts"
  - "apps/ttb-studio/src/lib/server/studio/runners/router.ts"
  - "apps/ttb-studio/src/lib/server/studio/runners/routed.ts"
---

# Studio models and runners

## Definition

A model makes the music; a runner is who runs it. Each studio model lists runners in preference order (self-hosted engine, provider API, Replicate), and the router falls back only when a runner refused before any job existed.

## How it works

- The table lives in `apps/ttb-studio/src/lib/server/studio/runners/models.ts:55-278`; per-model runner order is `apps/ttb-studio/src/lib/server/studio/runners/models.ts:2-4`.
- Availability is decided per runner from keys and one shared engine health read (`apps/ttb-studio/src/lib/server/studio/runners/router.ts:6-10`, `apps/ttb-studio/src/lib/server/studio/runners/router.ts:31-46`).
- `route` falls back only on `RunnerRefused`; any other error may mean an accepted, paid job and is rethrown (`apps/ttb-studio/src/lib/server/studio/runners/router.ts:69-112`).
- Each song stores a runner record with every attempt (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:169-179`, `apps/ttb-studio/src/lib/server/studio/create.ts:211-215`).

## Why it matters

It guarantees no double payment across providers and makes the recorded licence and model version auditable per song.

## Examples in this codebase

- [[entities/mod-studio-runner-models]]
- [[entities/mod-studio-runner-router]]
- [[entities/mod-studio-runner-routed]]

## Connections

- **involves entities:** [[entities/mod-studio-runner-models]], [[entities/mod-studio-runner-router]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-direct]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-create]], [[entities/mod-studio-edit]], [[entities/mod-studio-engines]]
- **related concepts:** [[concepts/studio-job-lifecycle]], [[concepts/studio-seance-blind-comparison]]

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/models.ts`
- `apps/ttb-studio/src/lib/server/studio/runners/router.ts`
- `apps/ttb-studio/src/lib/server/studio/runners/routed.ts`
