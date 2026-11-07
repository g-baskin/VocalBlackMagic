---
type: entity
title: "@vbm/contracts (packages/contracts/src/index.ts)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-voice]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-contracts-engine]]"
used_by:
  - "[[entities/mod-music-prompt]]"
  - "[[entities/mod-music-capabilities]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-page]]"
  - "[[entities/test-contracts]]"
  - "[[entities/test-music]]"
  - "[[entities/test-lyrics]]"
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-contracts-voice]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-contracts]]"
  - "[[entities/test-contracts-engine]]"
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
  - "[[concepts/contracts-engine-protocol-parity]]"
sources:
  - "packages/contracts/src/index.ts"
---

# @vbm/contracts (packages/contracts/src/index.ts)

> [!contradiction]
> Updated in place at HEAD `b58d457` (wiki previously built at `29c84e4`).
> Prior contract: index.ts was the whole package (lines 1-91), with `depends_on: none`; used_by included [[entities/route-vf-page]].
> New contract: index.ts re-exports `./voice`, `./studio`, `./engine` (`packages/contracts/src/index.ts:92-94`); Vocal Fix no longer imports from `apps/vocal-fix/src/routes/+page.svelte` (its importers are `apps/vocal-fix/src/lib/server/forge.ts:4`, `apps/vocal-fix/src/routes/voices/+page.svelte:3`).

## Overview

Package entry point for `@vbm/contracts` (`packages/contracts/package.json`, export `.` to `./src/index.ts`). It still defines the legacy generation contracts (`packages/contracts/src/index.ts:1-91`) and, since commit `09057ad`, re-exports the voice, studio and engine contract files (`packages/contracts/src/index.ts:92-94`).

## Signature / Definition

```ts
export const soundCharacters, soundCharacterNames, generationEngines, minSongSeconds, maxSongSeconds
export type SoundCharacter, GenerationEngine, SongMode, GenerationJobStatus
export interface GenerationRequest, InlineAudio, GenerationJob, EngineCapability, TTBCapabilities, UploadedRecording, VocalReferenceSession
export function validateGenerationRequest(request: GenerationRequest): string | null
export * from './voice'; export * from './studio'; export * from './engine'
```

## Behavior

- Sound characters are `raw`, `vintage`, `live`, `clean`, `custom` with display names (`packages/contracts/src/index.ts:1-9`).
- Legacy song length bounds are 10 to 240 seconds (`packages/contracts/src/index.ts:25-26`).
- Re-exports [[entities/mod-contracts-voice]], [[entities/mod-contracts-studio]] and [[entities/mod-contracts-engine]] (`packages/contracts/src/index.ts:92-94`); `studio.ts` imports `soundCharacters` back from this file (`packages/contracts/src/studio.ts:1`).
- Importers at HEAD: 47 app source files plus 3 Vocal Fix files import `@vbm/contracts` (grep of `apps/*/src`, excluding build output). Representative: `apps/ttb-studio/src/routes/api/generations/+server.ts:7`, `apps/ttb-studio/src/lib/server/studio/runners/engine.ts:13`, `apps/vocal-fix/src/lib/server/forge.ts:4`.
- TTBCapabilities is still consumed by `apps/ttb-studio/src/lib/server/music/capabilities.ts:1`; `EngineCapability` and `UploadedRecording` have no direct importer.
- Atomic pages: [[entities/contract-generation-request]], [[entities/contract-generation-job]], [[entities/contract-generation-engines]], [[entities/contract-validate-generation-request]], [[entities/contract-inline-audio]], [[entities/contract-vocal-reference-session]].

## Connections

- **depends_on:** [[entities/mod-contracts-voice]], [[entities/mod-contracts-studio]], [[entities/mod-contracts-engine]]
- **used_by:** [[entities/mod-music-prompt]], [[entities/mod-music-capabilities]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-page]], [[entities/test-contracts]], [[entities/test-music]], [[entities/test-lyrics]], [[entities/mod-contracts-engine]], [[entities/mod-contracts-studio]], [[entities/mod-contracts-voice]]
- **related:** [[entities/contract-generation-request]], [[entities/contract-generation-job]], [[entities/contract-generation-engines]], [[entities/contract-validate-generation-request]], [[entities/contract-inline-audio]], [[entities/contract-vocal-reference-session]], [[concepts/contracts-engine-protocol-parity]]

## Tested by

- [[entities/test-contracts]]
- [[entities/test-contracts-engine]]

## Prior claims

> [!stale]
> Superseded at HEAD `b58d457` (change landed in commit `09057ad`, 2026-11-06); see the [!contradiction] callout above.
> Prior claim (wiki built at `29c84e4`): depends_on none found in source; used_by [[entities/route-vf-page]] (VocalReferenceSession cast in the Vocal Fix page).

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/index.ts`
