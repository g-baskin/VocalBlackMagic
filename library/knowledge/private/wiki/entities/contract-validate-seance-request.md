---
type: entity
title: "validateSeanceRequest / validateSeanceRanking"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/studio.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/contract-seance]]"
used_by:
  - "[[entities/route-ttb-post-studio-seances]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - function
  - contract
  - studio
  - seance
related:
  - "[[questions/contracts-unused-seance-ranking-validator]]"
sources:
  - "packages/contracts/src/studio.ts"
---

# validateSeanceRequest / validateSeanceRanking

## Overview

Shape checks for `POST /api/studio/seances` and its ranking (`packages/contracts/src/studio.ts:306-343`).

## Signature / Definition

```ts
export function validateSeanceRequest(body: unknown): string | null
export function validateSeanceRanking(body: unknown, labels: readonly string[]): string | null
```

## Behavior

- Prompt 1 to 2000, lyrics up to 6000, title up to 120, 2 to 4 distinct known models (`packages/contracts/src/studio.ts:306-331`); readiness is checked on the server (`packages/contracts/src/studio.ts:309`).
- Ranking must list every label exactly once (`packages/contracts/src/studio.ts:335-343`).
- `validateSeanceRequest` is called by the Séance page (`apps/ttb-studio/src/routes/seance/+page.svelte:106`) and the route (`apps/ttb-studio/src/routes/api/studio/seances/+server.ts:17`). `validateSeanceRanking` has no caller in `apps/` at HEAD (grep).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/contract-seance]]
- **used_by:** [[entities/route-ttb-post-studio-seances]]
- **related:** [[questions/contracts-unused-seance-ranking-validator]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/contracts/src/studio.ts`
