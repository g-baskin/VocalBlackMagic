---
type: entity
title: "TTB Studio POST /api/studio/songs"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-create]]"
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: POST
route_path: "/api/studio/songs"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/+server.ts"
---

# TTB Studio POST /api/studio/songs

## Overview

Creates songs: the primary generation entry point at HEAD (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:23-35`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 422 with `validateCreateSongRequest` detail (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:26-28`); success is 202 with the `createSongs` result (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:29-31`).
- Caller: `summon` (`apps/ttb-studio/src/routes/+page.svelte:288-291`), which reads `job`, `lyrics` and `title` from the reply.

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-contracts-studio]], [[entities/mod-studio-create]]
- **used_by:** [[entities/route-ttb-page]]
- **related:** [[concepts/hosted-generation-flow]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/+server.ts`
