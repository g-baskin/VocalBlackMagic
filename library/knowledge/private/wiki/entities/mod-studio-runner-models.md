---
type: entity
title: "studio/runners/models.ts (models x runners table)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/models.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/mod-studio-replicate]]"
used_by:
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-runner-direct]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/mod-studio-runner-router]]"
  - "[[entities/test-studio-router]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-studio-router]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/models.ts"
---

# studio/runners/models.ts (models x runners table)

## Overview

The catalogue of seven models and, per model, its runners in preference order: self-hosted engine, provider API, then Replicate.

## Signature / Definition

```ts
export type RunnerKind = 'engine' | 'fal' | 'minimax' | 'elevenlabs' | 'gemini' | 'replicate'
export const runnerKeys: Record<RunnerKind, string>
export interface ModelInput; export interface RunnerSpec; export interface ModelSpec
export const models: ModelSpec[]
export function modelSpec(id: string): ModelSpec | undefined
```

## Behavior

- Each runner kind names the env keys it needs (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:11-18`).
- Runners record exact model version, licence and a commercial flag (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:28-42`).
- Models: ACE-Step 1.5 (engine, fal, Replicate visoar) (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:56-93`); HeartMuLa (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:94-125`); DiffRhythm (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:126-158`); YuE, whose engine runner is CC-BY-NC-4.0 and non-commercial (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:159-190`); MiniMax Music 2.6 (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:191-220`); Lyria 3 Pro (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:221-247`); ElevenLabs Music (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:248-277`).

## Connections

- **depends_on:** [[entities/mod-contracts-engine]], [[entities/mod-studio-replicate]]
- **used_by:** [[entities/mod-studio-create]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-runner-direct]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-runner-router]], [[entities/test-studio-router]]
- **related:** [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-router]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/models.ts`
