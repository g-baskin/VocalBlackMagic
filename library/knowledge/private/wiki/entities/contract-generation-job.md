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
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - data-model
  - contract
related:
  - "[[entities/mod-music-jobs]]"
  - "[[concepts/hosted-generation-flow]]"
  - "[[entities/contract-studio-job]]"
sources:
  - "packages/contracts/src/index.ts"
---

# GenerationJob

> [!contradiction]
> Updated in place at HEAD `b58d457` (wiki previously built at `29c84e4`).
> Prior contract: used_by included [[entities/route-ttb-page]].
> New contract: `apps/ttb-studio/src/routes/+page.svelte` imports `StudioJob`, not `GenerationJob` (`apps/ttb-studio/src/routes/+page.svelte:21`).

## Overview

Legacy job reply shape (`packages/contracts/src/index.ts:27-41`). Studio jobs use [[entities/contract-studio-job]].

## Signature / Definition

```ts
type GenerationJobStatus = 'queued' | 'running' | 'completed' | 'failed'
interface GenerationJob { job_id; engine; status; detail?; audio_url?; audio?: InlineAudio; lyrics? }
```

## Behavior

- fal jobs start `queued` with id `fal.<uuid>` (`apps/ttb-studio/src/routes/api/generations/+server.ts:85-91`); Lyria jobs return `completed` with inline `audio` (`apps/ttb-studio/src/routes/api/generations/+server.ts:101-108`).
- `audio_url` is set only when a polled fal job completes (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:35-36`).
- Importers at HEAD are the two generations routes only (`apps/ttb-studio/src/routes/api/generations/+server.ts:5`, `apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:3`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/contract-inline-audio]]
- **used_by:** [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]]
- **related:** [[entities/mod-music-jobs]], [[concepts/hosted-generation-flow]], [[entities/contract-studio-job]]

## Tested by

- No test found in the repository for this entity.

## Prior claims

> [!stale]
> Superseded at HEAD `b58d457` (change landed in commit `f88cc09`, 2026-11-06); see the [!contradiction] callout above.
> Prior claim (wiki built at `29c84e4`): used_by: [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-page]].

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
