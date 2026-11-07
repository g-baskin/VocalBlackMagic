---
type: entity
title: "CreateSongRequest"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/contract-studio-engines]]"
  - "[[entities/contract-studio-models]]"
used_by:
  - "[[entities/contract-validate-create-song-request]]"
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/route-ttb-post-studio-songs]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - studio
related:
  - "[[entities/contract-generation-request]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# CreateSongRequest

## Overview

Body of a song creation request from the TTB editor (`packages/contracts/src/studio.ts:119-140`).

## Signature / Definition

```ts
interface CreateSongRequest { mode: 'simple'|'custom'; prompt; title; lyrics; style_tags; instrumental; engine: StudioEngine; model?: StudioModel | null; duration_seconds: number | null; sound_character; takes: 1|2; cover?; voice_id?; reference_song_id? }
```

## Behavior

- `model`, when set, routes through the first ready runner (`packages/contracts/src/studio.ts:129-130`).
- A voice summon needs `voice_id` plus a library `reference_song_id` (`packages/contracts/src/studio.ts:136-139`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/contract-studio-engines]], [[entities/contract-studio-models]]
- **used_by:** [[entities/contract-validate-create-song-request]], [[entities/mod-studio-create]], [[entities/mod-studio-engines]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-runner-routed]], [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-page]]
- **related:** [[entities/contract-generation-request]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
