---
type: entity
title: "TTB Studio POST /api/studio/seances"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/seances/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/route-ttb-studio-seances-deps]]"
used_by:
  - "[[entities/route-ttb-page-seance]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: POST
route_path: "/api/studio/seances"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-seance]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/seances/+server.ts"
---

# TTB Studio POST /api/studio/seances

## Overview

Starts a blind multi-model comparison (`apps/ttb-studio/src/routes/api/studio/seances/+server.ts:13-25`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 422 with `validateSeanceRequest` detail (`apps/ttb-studio/src/routes/api/studio/seances/+server.ts:16-18`); success is 202 `{seance}` (`apps/ttb-studio/src/routes/api/studio/seances/+server.ts:19-21`); errors via `seanceError`, which adds `refused` models on a `SeanceRefused` (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:49-53`).
- Caller: the Séance page (`apps/ttb-studio/src/routes/seance/+page.svelte:114-117`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-contracts-studio]], [[entities/mod-studio-seance]], [[entities/route-ttb-studio-seances-deps]]
- **used_by:** [[entities/route-ttb-page-seance]]
- **related:** [[concepts/ttb-seance]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/seances/+server.ts`
