---
type: entity
title: "LyricsRequest / validateLyricsRequest"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/route-ttb-post-studio-lyrics]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - studio
related: []
sources:
  - "packages/contracts/src/studio.ts"
---

# LyricsRequest / validateLyricsRequest

## Overview

Lyrics write, rewrite or extend request and its validator (`packages/contracts/src/studio.ts:142-149`, `packages/contracts/src/studio.ts:208-229`).

## Signature / Definition

```ts
type LyricsAction = 'write'|'rewrite'|'extend'
interface LyricsRequest { action; description; lyrics; instruction; max_chars }
export function validateLyricsRequest(value: unknown): string | null
```

## Behavior

- Description up to 3000, lyrics up to 15000, instruction up to 1000 (`packages/contracts/src/studio.ts:213-218`); write needs a 5+ char description, other actions 10+ chars of lyrics (`packages/contracts/src/studio.ts:219-220`); `max_chars` integer 100 to 4096 (`packages/contracts/src/studio.ts:221-227`).
- Called by the lyrics page (`apps/ttb-studio/src/routes/lyrics/+page.svelte:40`) and `POST /api/studio/lyrics` (`apps/ttb-studio/src/routes/api/studio/lyrics/+server.ts:17`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/mod-studio-lyrics]], [[entities/route-ttb-post-studio-lyrics]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
