---
type: entity
title: "TTB Studio GET /api/studio/songs/[id]/cover"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-range]]"
used_by:
  - "[[entities/mod-ttb-client-api]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: GET
route_path: "/api/studio/songs/[id]/cover"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts"
---

# TTB Studio GET /api/studio/songs/[id]/cover

## Overview

Serves cover art (`apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts:12-21`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read via `library.coverFile` and `fileResponse` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts:15-17`).
- URL built by `coverUrl` (`apps/ttb-studio/src/lib/client/api.ts:16-20`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-range]]
- **used_by:** [[entities/mod-ttb-client-api]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts`
