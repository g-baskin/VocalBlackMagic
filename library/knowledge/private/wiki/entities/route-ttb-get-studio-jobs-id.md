---
type: entity
title: "TTB Studio GET /api/studio/jobs/[id]"
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
  - "[[entities/mod-ttb-client-jobs]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
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

# TTB Studio GET /api/studio/jobs/[id]

## Overview

Advances and returns one studio job (`apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts:10-21`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- Returns `{job}` from `advanceJob`, so a poll also moves the job forward (`apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts:14-17`); errors go through `studioError` (`apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts:18-20`).
- Polled every 4 s by the summon page (`apps/ttb-studio/src/routes/+page.svelte:254-266`) and by `followJob` (`apps/ttb-studio/src/lib/client/jobs.ts:11-19`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-jobs]]
- **used_by:** [[entities/route-ttb-page]], [[entities/mod-ttb-client-jobs]]
- **related:** [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts`
