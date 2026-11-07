---
type: entity
title: "studio/seance.ts (blind model comparison)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/seance.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-studio-create]]"
used_by:
  - "[[entities/mod-studio-seal]]"
  - "[[entities/route-ttb-get-studio-seances]]"
  - "[[entities/route-ttb-post-studio-seances]]"
  - "[[entities/route-ttb-get-studio-seances-id]]"
  - "[[entities/route-ttb-post-studio-seances-id-rank]]"
  - "[[entities/route-ttb-get-studio-seances-leaderboard]]"
  - "[[entities/test-studio-seance]]"
  - "[[entities/test-studio-seal]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-seance]]"
  - "[[entities/test-studio-seal]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-seance-blind-comparison]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/seance.ts"
---

# studio/seance.ts (blind model comparison)

## Overview

The Seance: one take per model on the same prompt and lyrics, labelled A to D in shuffled order, with model and runner hidden until the user ranks the takes.

## Signature / Definition

```ts
export interface StoredEntry; export interface StoredSeance; export interface SeanceDeps
export class SeanceRefused extends ProviderError
export const seanceSeconds = 60; export const isSeanceId
export function shuffledLabels(n: number, random: () => number): SeanceLabel[]
export function refusals(infos, models, instrumental)
export async function loadSeance(deps, id): Promise<StoredSeance>
export async function startSeance(deps, request): Promise<Seance>
export function view(seance, jobs): Seance
export async function getSeance(deps, id); export async function rankSeance(deps, id, order)
export async function listSeances(deps); export function leaderboard(seances); export async function seanceLeaderboard(deps)
```

## Behavior

- Records live in `<root>/studio/seances/<uuid>.json`; non-UUID ids are 404 (`apps/ttb-studio/src/lib/server/studio/seance.ts:74-82`).
- Labels are a Fisher-Yates shuffle with an injected random source (`apps/ttb-studio/src/lib/server/studio/seance.ts:85-92`).
- Every model lacking a ready runner or the needed vocal/instrumental support is reported at once as a 422 before any paid work (`apps/ttb-studio/src/lib/server/studio/seance.ts:95-115`, `apps/ttb-studio/src/lib/server/studio/seance.ts:136-139`).
- Shared lyrics are written once unless every model writes its own (`apps/ttb-studio/src/lib/server/studio/seance.ts:141-154`).
- The record is saved before the first paid submission and after each one; each take goes through `create` with 60 s, raw character, one take and no cover (`apps/ttb-studio/src/lib/server/studio/seance.ts:177-208`).
- Before the reveal, `view` hides model, runner and failure detail, and marks every stage of a failed take as failed (`apps/ttb-studio/src/lib/server/studio/seance.ts:215-217`, `apps/ttb-studio/src/lib/server/studio/seance.ts:220-251`).
- `rankSeance` requires all takes finished, at least two, exactly the finished labels, and an exclusive `.ranked` file so only one ranking wins (`apps/ttb-studio/src/lib/server/studio/seance.ts:272-308`).
- `leaderboard` computes wins, appearances, win rate and mean rank per model and runner over revealed seances (`apps/ttb-studio/src/lib/server/studio/seance.ts:335-371`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-music-errors]], [[entities/mod-studio-create]]
- **used_by:** [[entities/mod-studio-seal]], [[entities/route-ttb-get-studio-seances]], [[entities/route-ttb-post-studio-seances]], [[entities/route-ttb-get-studio-seances-id]], [[entities/route-ttb-post-studio-seances-id-rank]], [[entities/route-ttb-get-studio-seances-leaderboard]], [[entities/test-studio-seance]], [[entities/test-studio-seal]]
- **related:** [[concepts/studio-seance-blind-comparison]]

## Tested by

- [[entities/test-studio-seance]]
- [[entities/test-studio-seal]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/seance.ts`
