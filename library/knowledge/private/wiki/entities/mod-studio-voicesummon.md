---
type: entity
title: "studio/voicesummon.ts (sing a new song in a forged voice)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/voicesummon.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-contracts-voice]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-gold]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-master]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-studio-voices]]"
used_by:
  - "[[entities/mod-studio-create]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-derived-songs]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/voicesummon.ts"
---

# studio/voicesummon.ts (sing a new song in a forged voice)

## Overview

Builds MiniMax Music-01 takes conditioned on a consented voice's Gold Vocal and an instrumental reference.

## Signature / Definition

```ts
export const voiceSummonCostUsd = 0.035
export async function instrumentalSources(library, songId): Promise<{ files: string[]; from: string }>
export function music01Lyrics(lyrics: string): string
export async function findVoice(root: string, id: string): Promise<VoiceModel>
export async function submitVoiceSummon(ctx, deps, request, voice, lyrics, plan): Promise<{ tasks; plan }>
```

## Behavior

- ffmpeg output is read into an inline MP3 data URI from a scratch dir that is always removed (`apps/ttb-studio/src/lib/server/studio/voicesummon.ts:18-27`).
- The instrumental reference uses drums, bass and other stems of the song or a stems child, else the full mix (`apps/ttb-studio/src/lib/server/studio/voicesummon.ts:30-50`).
- Lyrics lose section tags and fit 380 characters (`apps/ttb-studio/src/lib/server/studio/voicesummon.ts:52-60`); `findVoice` accepts only usable voices (422) (`apps/ttb-studio/src/lib/server/studio/voicesummon.ts:62-67`).
- `submitVoiceSummon` needs 10+ sung characters, one task per take on `replicateModels.reimagine`, and records voice consent metadata and the instrumental source (`apps/ttb-studio/src/lib/server/studio/voicesummon.ts:70-118`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-contracts-voice]], [[entities/mod-music-errors]], [[entities/mod-studio-engines]], [[entities/mod-studio-gold]], [[entities/mod-studio-jobs]], [[entities/mod-studio-library]], [[entities/mod-studio-master]], [[entities/mod-studio-replicate]], [[entities/mod-studio-voices]]
- **used_by:** [[entities/mod-studio-create]]
- **related:** [[concepts/studio-derived-songs]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/voicesummon.ts`
