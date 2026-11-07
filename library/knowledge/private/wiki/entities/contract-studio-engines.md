---
type: entity
title: "studioEngines / StudioEngineInfo"
entity_type: exported-symbol
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/mod-studio-engines]]"
  - "[[entities/contract-validate-create-song-request]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
symbol_kind: const
is_default_export: false
tags:
  - entity
  - exported-symbol
  - contract
  - studio
related:
  - "[[entities/contract-studio-models]]"
  - "[[entities/contract-generation-engines]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# studioEngines / StudioEngineInfo

## Overview

Legacy engine ids for creating library songs (`packages/contracts/src/studio.ts:3-12`) and their capability shape (`packages/contracts/src/studio.ts:36-48`).

## Signature / Definition

```ts
export const studioEngines = ['minimax-music-1.5','ace-step-replicate','stable-audio-2.5','lyria-2','fal-ace-step','lyria-3.5'] as const
interface StudioEngineInfo { id; name; status; vocals; instrumental; duration: {min;max} | null; max_lyrics; max_prompt; est_cost_usd }
```

## Behavior

- A different id list from the legacy [[entities/contract-generation-engines]] (`packages/contracts/src/index.ts:10`).
- `status` is `ready` or a plain reason such as a missing key (`packages/contracts/src/studio.ts:39-40`); `duration` null means the model picks the length (`packages/contracts/src/studio.ts:43-44`).
- `CreateSongRequest.engine` is ignored when `model` is set (`packages/contracts/src/studio.ts:127-130`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/mod-studio-engines]], [[entities/contract-validate-create-song-request]], [[entities/route-ttb-page]]
- **related:** [[entities/contract-studio-models]], [[entities/contract-generation-engines]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
