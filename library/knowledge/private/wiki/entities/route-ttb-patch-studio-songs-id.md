---
type: entity
title: "TTB Studio PATCH /api/studio/songs/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-seal]]"
used_by:
  - "[[entities/route-ttb-page-library]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: PATCH
route_path: "/api/studio/songs/[id]"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts"
---

# TTB Studio PATCH /api/studio/songs/[id]

## Overview

Renames or favourites a song (`apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts:28-53`).

## Signature / Definition

```ts
export const PATCH: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 422 unless the body is `{title?: string, favourite?: boolean}` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts:31-40`); returns the sealed updated song (`apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts:42-49`).
- Caller: Library `patch` (`apps/ttb-studio/src/routes/library/+page.svelte:36-49`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-seal]]
- **used_by:** [[entities/route-ttb-page-library]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts`
