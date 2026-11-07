---
type: entity
title: "TTB Studio POST /api/studio/songs/[id]/edit"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-edit]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: POST
route_path: "/api/studio/songs/[id]/edit"
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
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts"
---

# TTB Studio POST /api/studio/songs/[id]/edit

## Overview

Starts an extend, replace-section or restyle job whose result is a new song (`apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts:25-39`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 422 from `validateEditRequest(body, null)`; the range is checked later in `startEdit` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts:29-32`); 202 `{job}` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts:33-35`).
- Called through `startRitual`, which posts to `/api/studio/songs/<id>/<path>` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:109-129`); the `edit` literal appears at `apps/ttb-studio/src/routes/library/[id]/+page.svelte:183-200`.

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-contracts-studio]], [[entities/mod-studio-edit]]
- **used_by:** [[entities/route-ttb-page-library-id]]
- **related:** [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts`
