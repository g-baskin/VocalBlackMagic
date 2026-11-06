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
  - "[[entities/route-ttb-page]]"
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
sources:
  - "packages/contracts/src/index.ts"
---

# GenerationRequest

## Overview

Request body for song generation shared by the editor and the server route (`packages/contracts/src/index.ts:13-24`).

## Signature / Definition

```ts
interface GenerationRequest { prompt; lyrics: string | null; mode: SongMode; engine: GenerationEngine; sound_character; premium_studio: boolean; texture; human_variation; mastering_intensity; duration_seconds }
```

## Behavior

- `mode` is `full-song` or `instrumental` (`packages/contracts/src/index.ts:12`). `premium_studio` is an independent boolean (`packages/contracts/src/index.ts:19`).
- Built by the page (`apps/ttb-studio/src/routes/+page.svelte:174-185`) and parsed by the route (`apps/ttb-studio/src/routes/api/generations/+server.ts:27-46`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/contract-validate-generation-request]], [[entities/mod-music-prompt]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-page]]
- **related:** [[concepts/premium-studio]], [[entities/mod-ttb-studio-python-app]]

## Tested by

- [[entities/test-contracts]]

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
