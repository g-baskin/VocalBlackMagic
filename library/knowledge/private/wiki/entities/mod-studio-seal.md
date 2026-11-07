---
type: entity
title: "studio/seal.ts (hiding seance takes before the reveal)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/seal.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-seance]]"
used_by:
  - "[[entities/route-ttb-get-studio-songs]]"
  - "[[entities/route-ttb-post-studio-songs]]"
  - "[[entities/route-ttb-get-studio-songs-id]]"
  - "[[entities/route-ttb-patch-studio-songs-id]]"
  - "[[entities/route-ttb-delete-studio-songs-id]]"
  - "[[entities/route-ttb-get-studio-songs-id-cover]]"
  - "[[entities/route-ttb-post-studio-songs-id-cover]]"
  - "[[entities/test-studio-seal]]"
  - "[[entities/test-studio-review]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-seal]]"
  - "[[entities/test-studio-review]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-seance-blind-comparison]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/seal.ts"
---

# studio/seal.ts (hiding seance takes before the reveal)

## Overview

Strips everything that would identify a seance take's model from library song metadata until that seance is revealed.

## Signature / Definition

```ts
export const sealedLabel: string
export function sealSong(song: SongMeta, seance?: StoredSeance | null): SongMeta
export async function sealSongs(root: string, songs: SongMeta[]): Promise<SongMeta[]>
```

## Behavior

- Removes the `runner`, `model_version`, `model`, `engine` and `est_cost_usd` params (`apps/ttb-studio/src/lib/server/studio/seal.ts:6`, `apps/ttb-studio/src/lib/server/studio/seal.ts:15-17`).
- Drops the `runner` record, replaces `engine` with the sealed label, sets `est_cost_usd` to 0 and replaces lyrics with the seance's shared lyrics (null without a seance), because Lyria 3 Pro writes its own (`apps/ttb-studio/src/lib/server/studio/seal.ts:14-27`).
- `sealSongs` passes through songs with no `seance_id`, loads each seance once, and seals when the seance is unrevealed or unreadable (fail closed) (`apps/ttb-studio/src/lib/server/studio/seal.ts:30-44`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-studio-seance]]
- **used_by:** [[entities/route-ttb-get-studio-songs]], [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-get-studio-songs-id]], [[entities/route-ttb-patch-studio-songs-id]], [[entities/route-ttb-delete-studio-songs-id]], [[entities/route-ttb-get-studio-songs-id-cover]], [[entities/route-ttb-post-studio-songs-id-cover]], [[entities/test-studio-seal]], [[entities/test-studio-review]]
- **related:** [[concepts/studio-seance-blind-comparison]]

## Tested by

- [[entities/test-studio-seal]]
- [[entities/test-studio-review]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/seal.ts`
