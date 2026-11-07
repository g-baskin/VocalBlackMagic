---
type: entity
title: "studio/runners/direct.ts (MiniMax, ElevenLabs, Lyria 3 Pro direct)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/direct.ts"
language: ts
depends_on:
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-audio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-studio-runner-models]]"
  - "[[entities/ext-api-minimax-io]]"
  - "[[entities/ext-api-elevenlabs-io]]"
  - "[[entities/env-minimax-api-key]]"
  - "[[entities/env-elevenlabs-api-key]]"
used_by:
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/test-studio-direct]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-studio-direct]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/direct.ts"
---

# studio/runners/direct.ts (MiniMax, ElevenLabs, Lyria 3 Pro direct)

## Overview

Synchronous direct-provider adapters. An HTTP refusal at create time means nothing was made and is safe to fall back from.

## Signature / Definition

```ts
export const lyria3ProModel = 'lyria-3-pro-preview'
export function minimaxBody(i: ModelInput, model?): Record<string, unknown>
export async function minimaxGenerate(deps: DirectDeps, i: ModelInput): Promise<DirectResult>
export function elevenlabsBody(i: ModelInput): Record<string, unknown>
export async function elevenlabsGenerate(deps, i): Promise<DirectResult>
export async function lyria3ProGenerate(deps, i): Promise<DirectResult>
```

## Behavior

- HTTP errors become `RunnerRefused` with 502/402/429/422 mapping (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:31-42`).
- MiniMax uses `music-2.6` with hex output, a Bearer key and a 600 s timeout; non-zero `status_code` on HTTP 200 is a refusal (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:51-60`, `apps/ttb-studio/src/lib/server/studio/runners/direct.ts:62-91`).
- ElevenLabs uses `music_v1`, `xi-api-key`, length clamped to 3..600 s, and reads at most 160 MiB (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:93-100`, `apps/ttb-studio/src/lib/server/studio/runners/direct.ts:102-118`).
- Lyria 3 Pro reuses `generateLyria` with `lyria-3-pro-preview`, verifies the base64 audio, and converts only `lyria failed with` HTTP errors into refusals (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:120-151`).

## Connections

- **depends_on:** [[entities/mod-music-lyria]], [[entities/mod-music-audio]], [[entities/mod-music-errors]], [[entities/mod-studio-replicate]], [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-models]], [[entities/ext-api-minimax-io]], [[entities/ext-api-elevenlabs-io]], [[entities/env-minimax-api-key]], [[entities/env-elevenlabs-api-key]]
- **used_by:** [[entities/mod-studio-runner-routed]], [[entities/test-studio-direct]]
- **related:** [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-direct]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/direct.ts`
