---
type: entity
title: "EditRequest / StudioEditInfo"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/mod-studio-edit]]"
  - "[[entities/route-ttb-post-studio-songs-id-edit]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - studio
related:
  - "[[entities/contract-engine-job-request]]"
  - "[[entities/contract-validate-edit-request]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# EditRequest / StudioEditInfo

## Overview

Suno-style edits (extend, repaint, cover) of a library song; each makes a NEW song with `parent_id` (`packages/contracts/src/studio.ts:345-372`).

## Signature / Definition

```ts
export const editActions = ['extend','repaint','cover'] as const
interface EditRequest { action; extend?; repaint?; strength?; prompt?; lyrics?; title? }
interface StudioEditInfo { action; available; runner; model_version; reason }
```

## Behavior

- Mirrors the engine task fields of [[entities/contract-engine-job-request]] but uses a flat `strength` (`packages/contracts/src/studio.ts:355-356`).
- `StudioEditInfo.reason` joins every runner reason when unavailable (`packages/contracts/src/studio.ts:370-371`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/mod-studio-edit]], [[entities/route-ttb-post-studio-songs-id-edit]]
- **related:** [[entities/contract-engine-job-request]], [[entities/contract-validate-edit-request]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
