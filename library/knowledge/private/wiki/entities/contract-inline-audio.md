---
type: entity
title: "InlineAudio"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/contract-generation-job]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - data-model
  - contract
related: []
sources:
  - "packages/contracts/src/index.ts"
---

# InlineAudio

## Overview

Base64 audio carried inside a job reply (`packages/contracts/src/index.ts:28-32`).

## Signature / Definition

```ts
interface InlineAudio { content_type: 'audio/mpeg' | 'audio/wav'; data_base64: string; bytes: number }
```

## Behavior

- Produced only by the Lyria adapter after verification (`apps/ttb-studio/src/lib/server/music/lyria.ts:62-71`); decoded in the browser (`apps/ttb-studio/src/routes/+page.svelte:94-97`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/contract-generation-job]], [[entities/mod-music-lyria]], [[entities/route-ttb-page]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
