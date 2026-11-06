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
  - "[[entities/route-ttb-page]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-contracts]]"
tags:
  - entity
  - function
  - contract
related: []
sources:
  - "packages/contracts/src/index.ts"
---

# validateGenerationRequest

## Overview

Pure validator returning an error message or null (`packages/contracts/src/index.ts:71-91`).

## Signature / Definition

```ts
export function validateGenerationRequest(request: GenerationRequest): string | null
```

## Behavior

- Prompt trimmed length at least 5 and raw length at most 3000 (`packages/contracts/src/index.ts:72-73`); lyrics at most 15000 (`packages/contracts/src/index.ts:74`); known engine, sound character and mode (`packages/contracts/src/index.ts:75-77`).
- `duration_seconds` an integer from 10 to 240 (`packages/contracts/src/index.ts:78-85`); `texture`, `human_variation`, `mastering_intensity` integers 0 to 100 (`packages/contracts/src/index.ts:86-89`).
- Runs both in the browser (`apps/ttb-studio/src/routes/+page.svelte:186`) and on the server (`apps/ttb-studio/src/routes/api/generations/+server.ts:45`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/contract-generation-request]], [[entities/contract-generation-engines]]
- **used_by:** [[entities/route-ttb-post-generations]], [[entities/route-ttb-page]]
- **related:** none

## Tested by

- [[entities/test-contracts]]

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
