---
type: entity
title: "StudioJob"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - studio
related:
  - "[[entities/contract-generation-job]]"
  - "[[entities/ui-ritual-progress]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# StudioJob

## Overview

Async studio job with named stages (`packages/contracts/src/studio.ts:99-117`).

## Signature / Definition

```ts
type StudioJobKind = 'create'|'reimagine'|'stems'|'voice'|'edit'
type StudioJobStatus = 'queued'|'running'|'completed'|'failed'|'canceled'
interface JobStage { id; label; state: 'pending'|'active'|'done'|'failed' }
interface StudioJob { id; kind; status; stages; detail?; song_ids; created_at; updated_at }
```

## Behavior

- Stage states match the `stages` prop of [[entities/ui-ritual-progress]] (`packages/ui/src/RitualProgress.svelte:6`).
- Spelled `canceled` here but `cancelled` in [[entities/contract-engine-job]] (`packages/contracts/src/engine.ts:16`).
- Client polling helper imports it (`apps/ttb-studio/src/lib/client/jobs.ts:1`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/mod-studio-jobs]], [[entities/mod-studio-create]], [[entities/mod-studio-edit]], [[entities/mod-studio-seance]], [[entities/mod-studio-derive]], [[entities/route-ttb-page]]
- **related:** [[entities/contract-generation-job]], [[entities/ui-ritual-progress]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
