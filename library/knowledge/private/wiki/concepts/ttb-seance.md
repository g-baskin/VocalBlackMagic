---
type: concept
title: "The Séance (blind model comparison)"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "seance"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/studio-seance-blind-comparison]]"
  - "[[concepts/ttb-job-polling]]"
sources:
  - "apps/ttb-studio/src/routes/seance/+page.svelte"
  - "apps/ttb-studio/src/routes/api/studio/seances/_deps.ts"
---

# The Séance (blind model comparison)

## Definition

A blind A/B/C/D test: one prompt to up to four models, the user ranks unlabeled takes, then models are revealed and a leaderboard updates (`apps/ttb-studio/src/routes/seance/+page.svelte:90-125`, `apps/ttb-studio/src/routes/seance/+page.svelte:245-262`).

## How it works

- Start: POST `/api/studio/seances` (202), wired by `seanceDeps` to `createSongs` and live capabilities (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:10-45`).
- Refused models come back as 422 `refused` rather than being dropped (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:48-53`).
- Rank: POST `.../rank` with `order`, best first (`apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts:10-17`).

## Why it matters

It gives evidence-based model choice instead of name bias.

## Examples in this codebase

- [[entities/route-ttb-page-seance]]
- [[entities/route-ttb-studio-seances-deps]]
- [[entities/mod-ttb-client-seance-time]]

## Connections

- **involves entities:** [[entities/route-ttb-page-seance]], [[entities/route-ttb-studio-seances-deps]], [[entities/route-ttb-post-studio-seances]], [[entities/route-ttb-post-studio-seances-id-rank]], [[entities/route-ttb-get-studio-seances-leaderboard]], [[entities/mod-studio-seance]], [[entities/mod-ttb-client-seance-time]]
- **related concepts:** [[concepts/ttb-job-polling]]

## Sources

- `apps/ttb-studio/src/routes/seance/+page.svelte`
- `apps/ttb-studio/src/routes/api/studio/seances/_deps.ts`

## See also

- [[concepts/studio-seance-blind-comparison]]: server-side record, sealing and leaderboard.
