---
type: entity
title: "contracts studio.ts (song studio, edits, Séance)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/mod-contracts]]"
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-studio-seal]]"
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - module
  - package
  - contract
  - studio
related:
  - "[[entities/contract-studio-engines]]"
  - "[[entities/contract-studio-models]]"
  - "[[entities/contract-studio-model-info]]"
  - "[[entities/contract-song-meta]]"
  - "[[entities/contract-studio-job]]"
  - "[[entities/contract-create-song-request]]"
  - "[[entities/contract-validate-create-song-request]]"
  - "[[entities/contract-lyrics-request]]"
  - "[[entities/contract-seance]]"
  - "[[entities/contract-validate-seance-request]]"
  - "[[entities/contract-edit-request]]"
  - "[[entities/contract-validate-edit-request]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# contracts studio.ts (song studio, edits, Séance)

## Overview

Contracts for the TTB Studio song library: engines and models, songs, jobs, lyrics, the Séance blind comparison and Suno-style edits (`packages/contracts/src/studio.ts:1-411`). Imports `soundCharacters` from the index (`packages/contracts/src/studio.ts:1`).

## Signature / Definition

```ts
export const studioEngines, studioModels, songKinds, stemNames, seanceLabels, editActions
export interface StudioRunnerRecord, StudioEngineInfo, StoredAudio, SongMeta, JobStage, StudioJob, CreateSongRequest, LyricsRequest, StudioRunnerInfo, StudioModelInfo, SeanceRequest, SeanceEntry, Seance, SeanceLeaderRow, EditRequest, StudioEditInfo
export function validateCreateSongRequest, validateLyricsRequest, validateSeanceRequest, validateSeanceRanking, validateEditRequest
```

## Behavior

- Song kinds: original, reimagine, stems, voice, master, extend, repaint, restyle (`packages/contracts/src/studio.ts:50-60`); stems are vocals, drums, bass, other (`packages/contracts/src/studio.ts:61-62`).
- `StoredAudio` is `{ file, content_type, bytes }` (`packages/contracts/src/studio.ts:64-68`).
- Imported by about 30 TTB Studio files; representative: `apps/ttb-studio/src/lib/server/studio/seance.ts:5-16`, `apps/ttb-studio/src/lib/server/studio/edit.ts:18-28`, `apps/ttb-studio/src/routes/+page.svelte:14-25`.
- Only `validateEditRequest` has a test, outside this package (`apps/ttb-studio/src/lib/server/studio/edit.test.ts:93-124`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/mod-contracts]], [[entities/mod-studio-create]], [[entities/mod-studio-edit]], [[entities/mod-studio-seance]], [[entities/mod-studio-jobs]], [[entities/mod-studio-library]], [[entities/mod-studio-engines]], [[entities/mod-studio-lyrics]], [[entities/mod-studio-seal]], [[entities/mod-studio-cover]], [[entities/mod-studio-derive]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-runner-routed]], [[entities/route-ttb-page]]
- **related:** [[entities/contract-studio-engines]], [[entities/contract-studio-models]], [[entities/contract-studio-model-info]], [[entities/contract-song-meta]], [[entities/contract-studio-job]], [[entities/contract-create-song-request]], [[entities/contract-validate-create-song-request]], [[entities/contract-lyrics-request]], [[entities/contract-seance]], [[entities/contract-validate-seance-request]], [[entities/contract-edit-request]], [[entities/contract-validate-edit-request]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
