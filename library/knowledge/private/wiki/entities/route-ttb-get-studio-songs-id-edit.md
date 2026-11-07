---
type: entity
title: "TTB Studio GET /api/studio/songs/[id]/edit"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-edit]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: GET
route_path: "/api/studio/songs/[id]/edit"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts"
---

# TTB Studio GET /api/studio/songs/[id]/edit

## Overview

Lists which edits the song supports now (`apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts:12-23`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read; returns `{edits}` from `editInfos` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts:16-19`).
- Caller: the song page effect (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:85-91`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-edit]]
- **used_by:** [[entities/route-ttb-page-library-id]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts`
