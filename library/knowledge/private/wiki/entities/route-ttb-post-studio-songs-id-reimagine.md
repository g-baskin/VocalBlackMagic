---
type: entity
title: "TTB Studio POST /api/studio/songs/[id]/reimagine"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/reimagine/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-derive]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: POST
route_path: "/api/studio/songs/[id]/reimagine"
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
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/reimagine/+server.ts"
---

# TTB Studio POST /api/studio/songs/[id]/reimagine

## Overview

Starts a reimagine job (`apps/ttb-studio/src/routes/api/studio/songs/[id]/reimagine/+server.ts:11-24`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- Lyrics over 15000 chars or titles over 120 are silently dropped to null rather than rejected (`apps/ttb-studio/src/routes/api/studio/songs/[id]/reimagine/+server.ts:14-17`); 202 `{job}` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/reimagine/+server.ts:19-20`).
- Called through `startRitual`, which posts to `/api/studio/songs/<id>/<path>` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:109-129`); the `reimagine` literal is at `apps/ttb-studio/src/routes/library/[id]/+page.svelte:412`.

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-derive]]
- **used_by:** [[entities/route-ttb-page-library-id]]
- **related:** [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/reimagine/+server.ts`
