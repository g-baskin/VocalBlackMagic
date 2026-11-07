---
type: entity
title: "TTB Studio GET /api/studio/songs"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-seal]]"
used_by:
  - "[[entities/route-ttb-page]]"
  - "[[entities/route-ttb-page-library]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: GET
route_path: "/api/studio/songs"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/+server.ts"
---

# TTB Studio GET /api/studio/songs

## Overview

Lists library songs (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:13-21`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read; returns `{songs}` after `sealSongs` over `library.list()` (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:14-19`).
- Callers: summon page (`apps/ttb-studio/src/routes/+page.svelte:210`), Library page (`apps/ttb-studio/src/routes/library/+page.svelte:29`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-seal]]
- **used_by:** [[entities/route-ttb-page]], [[entities/route-ttb-page-library]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/+server.ts`
