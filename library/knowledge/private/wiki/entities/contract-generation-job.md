---
type: entity
title: "GenerationJob"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-inline-audio]]"
used_by:
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-page]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - data-model
  - contract
related:
  - "[[entities/mod-music-jobs]]"
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "packages/contracts/src/index.ts"
---

# GenerationJob

## Overview

Job reply shape (`packages/contracts/src/index.ts:27-41`).

## Signature / Definition

```ts
type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed'
interface GenerationJob { job_id; engine; status; detail?; audio_url?; audio?: InlineAudio; lyrics? }
```

## Behavior

- fal jobs start `queued` with id `fal.<uuid>` (`apps/ttb-studio/src/routes/api/generations/+server.ts:85-91`); Lyria jobs return `completed` with inline `audio` (`apps/ttb-studio/src/routes/api/generations/+server.ts:101-108`).
- `audio_url` is set only when a polled fal job completes (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:35-36`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/contract-inline-audio]]
- **used_by:** [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-page]]
- **related:** [[entities/mod-music-jobs]], [[concepts/hosted-generation-flow]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
