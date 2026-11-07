---
type: entity
title: "SongMeta"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-seal]]"
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - studio
related:
  - "[[entities/contract-studio-job]]"
  - "[[entities/contract-seance]]"
  - "[[concepts/consent-record]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# SongMeta

## Overview

Stored metadata of one library song (`packages/contracts/src/studio.ts:70-97`).

## Signature / Definition

```ts
interface SongMeta { id; title; prompt; style_tags; lyrics; engine; params; created_at; parent_id; kind: SongKind; favourite; audio: StoredAudio | null; stems?; voice?; master?; est_cost_usd; seance_id?; runner?: StudioRunnerRecord; cover? }
```

## Behavior

- Derived songs point at their source via `parent_id` (`packages/contracts/src/studio.ts:79`), matching the non-destructive rule that edits make NEW songs (`packages/contracts/src/studio.ts:345`).
- `voice` records `consent_ref` and `attested_at` for voice songs (`packages/contracts/src/studio.ts:84`); `master` stores LUFS and true peak (`packages/contracts/src/studio.ts:85-89`).
- `seance_id` marks a sealed take whose model is hidden until reveal (`packages/contracts/src/studio.ts:91-92`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/mod-studio-library]], [[entities/mod-studio-jobs]], [[entities/mod-studio-edit]], [[entities/mod-studio-seal]], [[entities/mod-studio-cover]], [[entities/mod-studio-derive]], [[entities/mod-studio-voicesummon]], [[entities/route-ttb-page]]
- **related:** [[entities/contract-studio-job]], [[entities/contract-seance]], [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
