---
type: entity
title: "TTB Studio GET /api/studio/seances/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/seances/[id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/route-ttb-studio-seances-deps]]"
used_by:
  - "[[entities/route-ttb-page-seance]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: GET
route_path: "/api/studio/seances/[id]"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-seance]]"
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/seances/[id]/+server.ts"
---

# TTB Studio GET /api/studio/seances/[id]

## Overview

Returns one séance (`apps/ttb-studio/src/routes/api/studio/seances/[id]/+server.ts:6-17`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read; returns `{seance}` from `getSeance` (`apps/ttb-studio/src/routes/api/studio/seances/[id]/+server.ts:9-13`).
- Polled by the Séance page with up to 4 misses (`apps/ttb-studio/src/routes/seance/+page.svelte:127-150`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-seance]], [[entities/route-ttb-studio-seances-deps]]
- **used_by:** [[entities/route-ttb-page-seance]]
- **related:** [[concepts/ttb-seance]], [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/seances/[id]/+server.ts`
