---
type: entity
title: "TTB Studio DELETE /api/studio/jobs/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-jobs]]"
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: DELETE
route_path: "/api/studio/jobs/[id]"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts"
---

# TTB Studio DELETE /api/studio/jobs/[id]

## Overview

Cancels a studio job (`apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts:23-34`).

## Signature / Definition

```ts
export const DELETE: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- Returns `{job}` from `cancelJob` with `noStore` (`apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts:26-30`).
- Caller: the summon page cancel button (`apps/ttb-studio/src/routes/+page.svelte:303-310`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-jobs]]
- **used_by:** [[entities/route-ttb-page]]
- **related:** [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts`
