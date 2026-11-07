---
type: entity
title: "TTB Studio POST /api/studio/lyrics"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/lyrics/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-lyrics]]"
used_by:
  - "[[entities/route-ttb-page-lyrics]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: POST
route_path: "/api/studio/lyrics"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/lyrics/+server.ts"
---

# TTB Studio POST /api/studio/lyrics

## Overview

Runs the lyricist chain to write or revise lyrics (`apps/ttb-studio/src/routes/api/studio/lyrics/+server.ts:13-27`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 422 with `validateLyricsRequest` detail (`apps/ttb-studio/src/routes/api/studio/lyrics/+server.ts:16-18`); otherwise returns `runLyricistChain(lyricistChain(ctx), body)` (`apps/ttb-studio/src/routes/api/studio/lyrics/+server.ts:19-23`).
- Caller: the Lyrics page (`apps/ttb-studio/src/routes/lyrics/+page.svelte:48-51`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-contracts-studio]], [[entities/mod-studio-create]], [[entities/mod-studio-lyrics]]
- **used_by:** [[entities/route-ttb-page-lyrics]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/lyrics/+server.ts`
