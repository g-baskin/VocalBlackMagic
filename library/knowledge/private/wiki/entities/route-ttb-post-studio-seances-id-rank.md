---
type: entity
title: "TTB Studio POST /api/studio/seances/[id]/rank"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts"
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
route_path: "/api/studio/seances/[id]/rank"
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
  - "apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts"
---

# TTB Studio POST /api/studio/seances/[id]/rank

## Overview

Records the blind ranking and reveals the models (`apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts:7-22`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 422 unless `order` is a string array (`apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts:10-13`); returns `{seance}` from `rankSeance` (`apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts:15-17`).
- Caller: the Séance reveal (`apps/ttb-studio/src/routes/seance/+page.svelte:245-262`).

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

- `apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts`
