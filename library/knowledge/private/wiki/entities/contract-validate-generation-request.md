---
type: entity
title: "validateGenerationRequest"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-generation-request]]"
  - "[[entities/contract-generation-engines]]"
used_by:
  - "[[entities/route-ttb-post-generations]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-contracts]]"
tags:
  - entity
  - function
  - contract
related:
  - "[[questions/contracts-legacy-generation-contracts]]"
sources:
  - "packages/contracts/src/index.ts"
---

# validateGenerationRequest

> [!contradiction]
> Updated in place at HEAD `b58d457` (wiki previously built at `29c84e4`).
> Prior contract: runs both in the browser (`apps/ttb-studio/src/routes/+page.svelte:186`) and on the server; used_by [[entities/route-ttb-page]].
> New contract: server route only (`apps/ttb-studio/src/routes/api/generations/+server.ts:45`); `apps/ttb-studio/src/routes/+page.svelte` imports `validateCreateSongRequest` (`apps/ttb-studio/src/routes/+page.svelte:15`).

## Overview

Pure validator for the legacy `/api/generations` request, returning an error message or null (`packages/contracts/src/index.ts:71-91`).

## Signature / Definition

```ts
export function validateGenerationRequest(request: GenerationRequest): string | null
```

## Behavior

- Prompt trimmed length at least 5 and raw length at most 3000 (`packages/contracts/src/index.ts:72-73`); lyrics at most 15000 (`packages/contracts/src/index.ts:74`); known engine, sound character and mode (`packages/contracts/src/index.ts:75-77`).
- `duration_seconds` an integer from 10 to 240 (`packages/contracts/src/index.ts:78-85`); `texture`, `human_variation`, `mastering_intensity` integers 0 to 100 (`packages/contracts/src/index.ts:86-89`).
- Server-side only at HEAD: the generations route calls it (`apps/ttb-studio/src/routes/api/generations/+server.ts:45`). The TTB editor page now validates with [[entities/contract-validate-create-song-request]] instead (`apps/ttb-studio/src/routes/+page.svelte:277`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/contract-generation-request]], [[entities/contract-generation-engines]]
- **used_by:** [[entities/route-ttb-post-generations]]
- **related:** [[questions/contracts-legacy-generation-contracts]]

## Tested by

- [[entities/test-contracts]]

## Prior claims

> [!stale]
> Superseded at HEAD `b58d457` (change landed in commit `f88cc09`, 2026-11-06); see the [!contradiction] callout above.
> Prior claim (wiki built at `29c84e4`): Runs both in the browser (`apps/ttb-studio/src/routes/+page.svelte:186`) and on the server; used_by [[entities/route-ttb-page]].

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
