---
type: concept
title: "Seance blind model comparison"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "Seance"
  - "blind ranking"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - studio
related:
  - "[[concepts/ttb-seance]]"
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/seance.ts"
  - "apps/ttb-studio/src/lib/server/studio/seal.ts"
---

# Seance blind model comparison

## Definition

A seance runs one take per model with shared prompt and lyrics under shuffled labels, hides identifying metadata until the user ranks, then feeds a leaderboard.

## How it works

- Start, persistence and per-take creates (`apps/ttb-studio/src/lib/server/studio/seance.ts:136-208`).
- Pre-reveal view and sealed library metadata (`apps/ttb-studio/src/lib/server/studio/seance.ts:220-251`, `apps/ttb-studio/src/lib/server/studio/seal.ts:14-44`).
- Single exclusive ranking (`apps/ttb-studio/src/lib/server/studio/seance.ts:272-308`); leaderboard (`apps/ttb-studio/src/lib/server/studio/seance.ts:335-371`).

## Why it matters

Users compare models without brand bias, and the studio learns which model and runner wins.

## Examples in this codebase

- [[entities/mod-studio-seance]]
- [[entities/mod-studio-seal]]

## Connections

- **involves entities:** [[entities/mod-studio-seance]], [[entities/mod-studio-seal]], [[entities/mod-studio-create]], [[entities/mod-studio-runner-capabilities]]
- **related concepts:** [[concepts/studio-models-and-runners]]

## Sources

- `apps/ttb-studio/src/lib/server/studio/seance.ts`
- `apps/ttb-studio/src/lib/server/studio/seal.ts`

## See also

- [[concepts/ttb-seance]]: browser flow and polling.
