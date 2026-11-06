---
type: entity
title: "@vbm/contracts (packages/contracts/src/index.ts)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-music-prompt]]"
  - "[[entities/mod-music-capabilities]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-page]]"
  - "[[entities/route-vf-page]]"
  - "[[entities/test-contracts]]"
  - "[[entities/test-music]]"
  - "[[entities/test-lyrics]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-contracts]]"
tags:
  - entity
  - module
  - package
related:
  - "[[entities/contract-generation-request]]"
  - "[[entities/contract-generation-job]]"
  - "[[entities/contract-generation-engines]]"
  - "[[entities/contract-validate-generation-request]]"
  - "[[entities/contract-inline-audio]]"
  - "[[entities/contract-vocal-reference-session]]"
sources:
  - "packages/contracts/src/index.ts"
---

# @vbm/contracts (packages/contracts/src/index.ts)

## Overview

Shared TypeScript contracts for both apps: sound characters, engines, generation request and job shapes, capability and reference-session types, and request validation (`packages/contracts/src/index.ts:1-91`).

## Signature / Definition

```ts
export const soundCharacters, soundCharacterNames, generationEngines, minSongSeconds, maxSongSeconds
export type SoundCharacter, GenerationEngine, SongMode, GenerationJobStatus
export interface GenerationRequest, InlineAudio, GenerationJob, EngineCapability, TTBCapabilities, UploadedRecording, VocalReferenceSession
export function validateGenerationRequest(request: GenerationRequest): string | null
```

## Behavior

- Sound characters are `raw`, `vintage`, `live`, `clean`, `custom` with display names (`packages/contracts/src/index.ts:1-9`).
- Song length bounds are 10 to 240 seconds (`packages/contracts/src/index.ts:25-26`).
- Atomic pages: [[entities/contract-generation-request]], [[entities/contract-generation-job]], [[entities/contract-generation-engines]], [[entities/contract-validate-generation-request]], [[entities/contract-inline-audio]], [[entities/contract-vocal-reference-session]].

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-prompt]], [[entities/mod-music-capabilities]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-page]], [[entities/route-vf-page]], [[entities/test-contracts]], [[entities/test-music]], [[entities/test-lyrics]]
- **related:** [[entities/contract-generation-request]], [[entities/contract-generation-job]], [[entities/contract-generation-engines]], [[entities/contract-validate-generation-request]], [[entities/contract-inline-audio]], [[entities/contract-vocal-reference-session]]

## Tested by

- [[entities/test-contracts]]

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
