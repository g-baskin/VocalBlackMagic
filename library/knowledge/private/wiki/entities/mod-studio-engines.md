---
type: entity
title: "studio/engines.ts (legacy engine catalogue and input builders)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/engines.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-replicate]]"
used_by:
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/route-ttb-get-studio-capabilities]]"
  - "[[entities/test-studio-studio]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/engines.ts"
---

# studio/engines.ts (legacy engine catalogue and input builders)

## Overview

The original studio engine list (before the models x runners router), Replicate model pins, derived-work prices and request checks for engine-based creates.

## Signature / Definition

```ts
export interface KeyState { replicate; fal; gemini; allowed }
export function engineInfos(keys: KeyState): StudioEngineInfo[]
export function engineSpec(id: StudioEngine): Spec
export const replicateModels: { ... } satisfies Record<string, ReplicateModel>
export const derivedCosts = { reimagine: 0.035, stems: 0.03, voice: 0.045, lyrics: 0.005 }
export function stylePrompt(request): string
export function minimaxLyrics(lyrics: string): string
export function fitLyrics(lyrics: string, max: number): string
export function engineRequestError(request, lyrics): string | null
export function replicateInput(request, lyrics): Record<string, unknown>
```

## Behavior

- Six engines with published limits and prices: MiniMax Music 1.5, ACE-Step on Replicate, Stable Audio 2.5, Lyria 2, ACE-Step 1.5 via fal and Lyria 3.5 (`apps/ttb-studio/src/lib/server/studio/engines.ts:19-86`).
- `engineInfos` reports `disabled outside development`, `ready`, or `needs <KEY>` per engine (`apps/ttb-studio/src/lib/server/studio/engines.ts:94-103`).
- `replicateModels` pins community versions (ace-step, demucs, realistic-voice-cloning) and names official ones, including the Replicate Claude lyricist and its fallback (`apps/ttb-studio/src/lib/server/studio/engines.ts:111-133`).
- `stylePrompt` joins prompt, style tags and the sound character name (`apps/ttb-studio/src/lib/server/studio/engines.ts:138-149`).
- `minimaxLyrics` keeps only lowercase intro/verse/chorus/bridge/outro tags, mapping pre-* to verse and hook to chorus (`apps/ttb-studio/src/lib/server/studio/engines.ts:152-168`); `fitLyrics` cuts at a line boundary (`apps/ttb-studio/src/lib/server/studio/engines.ts:171-175`).
- `engineRequestError` checks instrumental support, prompt and lyric length and duration range (`apps/ttb-studio/src/lib/server/studio/engines.ts:178-217`); `replicateInput` builds the per-engine Replicate input (`apps/ttb-studio/src/lib/server/studio/engines.ts:220-245`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/mod-contracts-studio]], [[entities/mod-studio-replicate]]
- **used_by:** [[entities/mod-studio-create]], [[entities/mod-studio-derive]], [[entities/mod-studio-lyrics]], [[entities/mod-studio-voicesummon]], [[entities/route-ttb-get-studio-capabilities]], [[entities/test-studio-studio]]
- **related:** [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/engines.ts`
