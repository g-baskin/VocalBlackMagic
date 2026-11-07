---
type: entity
title: "studio/derive.ts (stems, reimagine, voice, Studio Master)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/derive.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-contracts-voice]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-master]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-studio-voices]]"
used_by:
  - "[[entities/route-ttb-post-studio-songs-id-master]]"
  - "[[entities/route-ttb-post-studio-songs-id-reimagine]]"
  - "[[entities/route-ttb-post-studio-songs-id-stems]]"
  - "[[entities/route-ttb-post-studio-songs-id-voice]]"
  - "[[entities/test-studio-studio]]"
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
  - "[[concepts/premium-studio]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/derive.ts"
---

# studio/derive.ts (stems, reimagine, voice, Studio Master)

## Overview

Starts derived works from a library song. Every result is a new child song with `parent_id`; the parent is never modified.

## Signature / Definition

```ts
export async function startStems(ctx: JobContext, parentId: string): Promise<StudioJob>
export async function startReimagine(ctx, parentId, options: { lyrics; title }): Promise<StudioJob>
export async function voiceModelUrl(ctx, deps, voice: VoiceModel): Promise<string>
export async function startVoice(ctx, parentId, voice): Promise<StudioJob>
export async function masterSong(ctx: JobContext, parentId: string): Promise<SongMeta>
```

## Behavior

- Replicate-backed derivations need `REPLICATE_API_TOKEN` (503) (`apps/ttb-studio/src/lib/server/studio/derive.ts:19-23`) and respect the job cap (`apps/ttb-studio/src/lib/server/studio/derive.ts:37`).
- `startStems` uploads the main audio and runs Demucs `htdemucs` as a `stems` job (`apps/ttb-studio/src/lib/server/studio/derive.ts:36-59`).
- `startReimagine` strips section tags, fits lyrics to 380 characters, requires at least 10, and sends an inline 30 s MP3 reference to MiniMax Music-01 (`apps/ttb-studio/src/lib/server/studio/derive.ts:61-107`).
- `voiceModelUrl` prefers the local `<id>.model.zip` (validated name, must exist) uploaded to Replicate, else `model_url` (`apps/ttb-studio/src/lib/server/studio/derive.ts:110-126`).
- `startVoice` refuses voices that are not ready or lack own-voice consent, runs realistic-voice-cloning, and records performer, consent session and attestation time (`apps/ttb-studio/src/lib/server/studio/derive.ts:128-170`).
- `masterSong` runs `masterFile` into a reserved folder, inherits the cover, saves a `kind: master` song with target -14 LUFS / -1 dBTP and cost 0, and deletes the folder on failure (`apps/ttb-studio/src/lib/server/studio/derive.ts:173-204`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-contracts-voice]], [[entities/mod-music-errors]], [[entities/mod-studio-engines]], [[entities/mod-studio-jobs]], [[entities/mod-studio-cover]], [[entities/mod-studio-master]], [[entities/mod-studio-replicate]], [[entities/mod-studio-voices]]
- **used_by:** [[entities/route-ttb-post-studio-songs-id-master]], [[entities/route-ttb-post-studio-songs-id-reimagine]], [[entities/route-ttb-post-studio-songs-id-stems]], [[entities/route-ttb-post-studio-songs-id-voice]], [[entities/test-studio-studio]]
- **related:** [[concepts/studio-derived-songs]], [[concepts/premium-studio]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/derive.ts`
