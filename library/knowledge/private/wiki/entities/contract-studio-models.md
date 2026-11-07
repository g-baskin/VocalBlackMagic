---
type: entity
title: "studioModels / StudioRunnerRecord"
entity_type: exported-symbol
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/contract-validate-create-song-request]]"
  - "[[entities/contract-validate-seance-request]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-seance]]"
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
  - "[[entities/contract-studio-model-info]]"
  - "[[entities/contract-studio-engines]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# studioModels / StudioRunnerRecord

## Overview

Models (what makes the music) independent of runners (`packages/contracts/src/studio.ts:14-24`), and the record of which runner ran a song (`packages/contracts/src/studio.ts:26-34`).

## Signature / Definition

```ts
export const studioModels = ['ace-step-1.5','heartmula','diffrhythm','yue','minimax-music-2.6','lyria-3-pro','elevenlabs-music'] as const
interface StudioRunnerRecord { model; runner; model_version; license; commercial; attempts: { runner; model_version; outcome }[] }
```

## Behavior

- These ids differ from the engine protocol ids (`diffrhythm` vs `diffrhythm-2`, `yue` vs `yue2`; `packages/contracts/src/engine.ts:9`); the mapping lives in the Studio runners (see [[entities/mod-studio-runner-models]]).
- `attempts` keeps every runner tried with the reason it was skipped (`packages/contracts/src/studio.ts:26`, `packages/contracts/src/studio.ts:33`); stored on `SongMeta.runner` (`packages/contracts/src/studio.ts:93-94`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/contract-validate-create-song-request]], [[entities/contract-validate-seance-request]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-seance]]
- **related:** [[entities/contract-studio-model-info]], [[entities/contract-studio-engines]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
