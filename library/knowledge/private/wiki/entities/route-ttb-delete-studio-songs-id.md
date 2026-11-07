---
type: entity
title: "TTB Studio DELETE /api/studio/songs/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
used_by:
  - "[[entities/route-ttb-page-library]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: DELETE
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

# TTB Studio DELETE /api/studio/songs/[id]

## Overview

Deletes a song (`apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts:55-64`).

## Signature / Definition

```ts
export const DELETE: RequestHandler
```

## Behavior

- Guarded without a JSON requirement; returns 204 after `library.remove` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts:56-60`).
- Caller: Library `remove` after a `confirm` prompt (`apps/ttb-studio/src/routes/library/+page.svelte:54-62`).

## Connections

- **depends_on:** [[entities/mod-studio-context]]
- **used_by:** [[entities/route-ttb-page-library]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/+server.ts`
