---
type: entity
title: "studio/cover.ts (FLUX cover art)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/cover.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-replicate]]"
used_by:
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/route-ttb-get-studio-songs-id-cover]]"
  - "[[entities/route-ttb-post-studio-songs-id-cover]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
  - "[[entities/test-studio-review]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-song-library]]"
  - "[[concepts/studio-job-lifecycle]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/cover.ts"
---

# studio/cover.ts (FLUX cover art)

## Overview

Generates, verifies and stores square cover art for library songs via Replicate `black-forest-labs/flux-schnell`, and copies covers onto derived songs.

## Signature / Definition

```ts
export const coverModel = { owner: 'black-forest-labs', name: 'flux-schnell' }
export const coverCostUsd = 0.003
export function buildCoverPrompt(song): string
export function sniffImage(bytes: Uint8Array): 'image/webp' | 'image/png' | 'image/jpeg' | null
export async function conjureCover(library, deps, songId, sleep?): Promise<SongMeta>
export async function coverBytes(fetcher, output): Promise<Uint8Array>
export async function storeCover(library, songId, bytes): Promise<SongMeta>
export async function inheritCover(library, parentId, dir): Promise<SongMeta['cover']>
```

## Behavior

- Cover cost is recorded as $0.003 per image and covers are capped at 8 MiB (`apps/ttb-studio/src/lib/server/studio/cover.ts:15-18`).
- The prompt uses an occult art direction, a mood picked by keyword regexes over title and lyrics, the first 160 prompt characters and five style tags, strips quotes and angle brackets, and forbids text, logos and real people (`apps/ttb-studio/src/lib/server/studio/cover.ts:20-26`, `apps/ttb-studio/src/lib/server/studio/cover.ts:29-43`).
- `sniffImage` recognises WEBP, PNG and JPEG by magic bytes (`apps/ttb-studio/src/lib/server/studio/cover.ts:45-52`).
- `conjureCover` creates a 1:1 webp prediction with a 30 s wait, polls up to 30 times every 2 s, and fails with 502 unless it succeeded (`apps/ttb-studio/src/lib/server/studio/cover.ts:57-91`).
- `coverBytes` accepts an inline `data:image/...;base64` URI (size-checked) or an allowed Replicate output URL fetched with a byte cap (`apps/ttb-studio/src/lib/server/studio/cover.ts:96-108`).
- `storeCover` refuses non-images and files under 1 KiB or over the cap, deletes a previous cover of another type, re-reads meta, and adds $0.003 to `est_cost_usd` (`apps/ttb-studio/src/lib/server/studio/cover.ts:111-130`).
- `inheritCover` copies a parent's cover file into the child folder and records `inherited_from`; any error yields no cover (`apps/ttb-studio/src/lib/server/studio/cover.ts:133-148`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-music-errors]], [[entities/mod-studio-library]], [[entities/mod-studio-replicate]]
- **used_by:** [[entities/mod-studio-jobs]], [[entities/mod-studio-derive]], [[entities/route-ttb-get-studio-songs-id-cover]], [[entities/route-ttb-post-studio-songs-id-cover]]
- **related:** [[concepts/studio-song-library]], [[concepts/studio-job-lifecycle]]

## Tested by

- [[entities/test-studio-studio]]
- [[entities/test-studio-review]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/cover.ts`
