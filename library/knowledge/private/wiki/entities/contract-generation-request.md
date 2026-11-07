---
type: entity
title: "GenerationRequest"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/contract-validate-generation-request]]"
  - "[[entities/mod-music-prompt]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/test-music]]"
  - "[[entities/test-lyrics]]"
  - "[[entities/mod-studio-create]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-contracts]]"
tags:
  - entity
  - data-model
  - contract
related:
  - "[[concepts/premium-studio]]"
  - "[[entities/mod-ttb-studio-python-app]]"
  - "[[entities/contract-create-song-request]]"
  - "[[questions/contracts-legacy-generation-contracts]]"
sources:
  - "packages/contracts/src/index.ts"
---

# GenerationRequest

> [!contradiction]
> Updated in place at HEAD `b58d457` (wiki previously built at `29c84e4`).
> Prior contract: built by the page (`apps/ttb-studio/src/routes/+page.svelte:174-185`); used_by [[entities/route-ttb-page]].
> New contract: no browser builder; only the legacy route and music adapters use it. The editor sends [[entities/contract-create-song-request]].

## Overview

Request body for the legacy hosted generation route (`packages/contracts/src/index.ts:13-24`). The studio song flow uses [[entities/contract-create-song-request]] instead.

## Signature / Definition

```ts
interface GenerationRequest { prompt; lyrics: string | null; mode: SongMode; engine: GenerationEngine; sound_character; premium_studio: boolean; texture; human_variation; mastering_intensity; duration_seconds }
```

## Behavior

- `mode` is `full-song` or `instrumental` (`packages/contracts/src/index.ts:12`). `premium_studio` is an independent boolean (`packages/contracts/src/index.ts:19`).
- Parsed by the route (`apps/ttb-studio/src/routes/api/generations/+server.ts:4-7`, `apps/ttb-studio/src/routes/api/generations/+server.ts:45`) and consumed by the music adapters (`apps/ttb-studio/src/lib/server/music/fal.ts:1`, `apps/ttb-studio/src/lib/server/music/lyria.ts:1`, `apps/ttb-studio/src/lib/server/music/prompt.ts:1`, `apps/ttb-studio/src/lib/server/music/lyricist.ts:1`) and by studio create (`apps/ttb-studio/src/lib/server/studio/create.ts:1`).
- No page builds it at HEAD; `apps/ttb-studio/src/routes/+page.svelte` builds a `CreateSongRequest` (`apps/ttb-studio/src/routes/+page.svelte:16`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/contract-validate-generation-request]], [[entities/mod-music-prompt]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/test-music]], [[entities/test-lyrics]], [[entities/mod-studio-create]]
- **related:** [[concepts/premium-studio]], [[entities/mod-ttb-studio-python-app]], [[entities/contract-create-song-request]], [[questions/contracts-legacy-generation-contracts]]

## Tested by

- [[entities/test-contracts]]

## Prior claims

> [!stale]
> Superseded at HEAD `b58d457` (change landed in commit `f88cc09`, 2026-11-06); see the [!contradiction] callout above.
> Prior claim (wiki built at `29c84e4`): Built by the page (`apps/ttb-studio/src/routes/+page.svelte:174-185`) and parsed by the route; used_by [[entities/route-ttb-page]].

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
