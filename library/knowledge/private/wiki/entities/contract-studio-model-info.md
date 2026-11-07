---
type: entity
title: "StudioModelInfo / StudioRunnerInfo"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - studio
related:
  - "[[entities/contract-studio-models]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# StudioModelInfo / StudioRunnerInfo

## Overview

Capabilities API shapes: a model with its runners in preference order (`packages/contracts/src/studio.ts:231-256`).

## Signature / Definition

```ts
interface StudioRunnerInfo { kind: 'engine'|'fal'|'minimax'|'elevenlabs'|'gemini'|'replicate'; model_version; license; commercial; license_badge; status }
interface StudioModelInfo { id; name; open; vocals; instrumental; runners; est_cost_usd; active_runner: kind | null }
```

## Behavior

- `license_badge` reads Non-commercial when weights forbid commercial use (`packages/contracts/src/studio.ts:238-239`).
- `active_runner` is the first ready runner or null (`packages/contracts/src/studio.ts:254-255`); `est_cost_usd` is a rough estimate, no billing guarantee (`packages/contracts/src/studio.ts:252-253`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-seance]], [[entities/route-ttb-page]]
- **related:** [[entities/contract-studio-models]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
