---
type: entity
title: "validateCreateSongRequest"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/contract-create-song-request]]"
used_by:
  - "[[entities/route-ttb-post-studio-songs]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - function
  - contract
  - studio
related: []
sources:
  - "packages/contracts/src/studio.ts"
---

# validateCreateSongRequest

## Overview

Shape and range checks shared by UI and server; engine limits are checked separately (`packages/contracts/src/studio.ts:154-206`).

## Signature / Definition

```ts
export function validateCreateSongRequest(value: unknown): string | null
```

## Behavior

- Prompt 5 to 3000, title up to 120, lyrics up to 15000, at most 20 style tags of 40 chars (`packages/contracts/src/studio.ts:159-170`).
- Engine must be a studio engine; model, when present, a studio model (`packages/contracts/src/studio.ts:172-179`); duration null or integer 10 to 240 (`packages/contracts/src/studio.ts:180-187`); takes 1 or 2 (`packages/contracts/src/studio.ts:193`).
- `voice_id` without `reference_song_id` is refused (`packages/contracts/src/studio.ts:203-204`).
- Called in the browser (`apps/ttb-studio/src/routes/+page.svelte:277`) and in `POST /api/studio/songs` (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:27`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/contract-create-song-request]]
- **used_by:** [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-page]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
