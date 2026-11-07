---
type: entity
title: "Seance / SeanceEntry / SeanceLeaderRow"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/contract-studio-models]]"
used_by:
  - "[[entities/mod-studio-seance]]"
  - "[[entities/route-ttb-post-studio-seances-id-rank]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - studio
  - seance
related:
  - "[[entities/contract-validate-seance-request]]"
  - "[[entities/contract-song-meta]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# Seance / SeanceEntry / SeanceLeaderRow

## Overview

The Séance: blind comparison of 2 to 4 models on the same prompt and lyrics (`packages/contracts/src/studio.ts:258-304`).

## Signature / Definition

```ts
export const seanceLabels = ['A','B','C','D'] as const
interface SeanceRequest { prompt; lyrics?; title?; instrumental?; models: StudioModel[] }
interface SeanceEntry { label; status; stages; detail?; song_id; rank; model?; runner? }
interface Seance { id; prompt; lyrics; instrumental; created_at; revealed; ranking: SeanceLabel[] | null; entries }
interface SeanceLeaderRow { model; runner; appearances; wins; win_rate; mean_rank }
```

## Behavior

- Entries are anonymised: `model` and `runner` appear only after reveal (`packages/contracts/src/studio.ts:272-283`).
- `ranking` lists labels best to worst once ranked (`packages/contracts/src/studio.ts:292-293`); `rank` 1 is best (`packages/contracts/src/studio.ts:279-280`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/contract-studio-models]]
- **used_by:** [[entities/mod-studio-seance]], [[entities/route-ttb-post-studio-seances-id-rank]]
- **related:** [[entities/contract-validate-seance-request]], [[entities/contract-song-meta]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
