---
type: entity
title: "validateEditRequest"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/contract-edit-request]]"
used_by:
  - "[[entities/route-ttb-post-studio-songs-id-edit]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - function
  - contract
  - studio
related:
  - "[[questions/contracts-edit-route-skips-song-length]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# validateEditRequest

## Overview

Shape and range checks for edits; `songSeconds` keeps repaint inside the song when known (`packages/contracts/src/studio.ts:376-411`).

## Signature / Definition

```ts
export function validateEditRequest(value: unknown, songSeconds: number | null): string | null
```

## Behavior

- Style up to 2000, lyrics up to 6000, title up to 120 (`packages/contracts/src/studio.ts:381-386`).
- extend: non-negative seconds, positive total, at most 240 (`packages/contracts/src/studio.ts:387-395`).
- repaint: section at least 1 s with a 1e-6 tolerance, end within the song plus 0.05 s when length is known (`packages/contracts/src/studio.ts:396-405`).
- cover: strength 0 to 1 and a non-blank style (`packages/contracts/src/studio.ts:406-409`).
- The edit route passes `songSeconds = null` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts:31`), so the end-of-song check does not run there. Tested in `apps/ttb-studio/src/lib/server/studio/edit.test.ts:93-124` (not run by me).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/contract-edit-request]]
- **used_by:** [[entities/route-ttb-post-studio-songs-id-edit]]
- **related:** [[questions/contracts-edit-route-skips-song-length]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
