---
type: concept
title: "TTB Studio job polling"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "followJob"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/studio-job-lifecycle]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "apps/ttb-studio/src/lib/client/jobs.ts"
  - "apps/ttb-studio/src/routes/+page.svelte"
---

# TTB Studio job polling

## Definition

Browser loops that GET a job or séance until it leaves `queued`/`running`; the server advances the job on each poll.

## How it works

- Summon page and `followJob` poll `/api/studio/jobs/<id>` every 4 s and retry on errors without a cap while the component lives (`apps/ttb-studio/src/routes/+page.svelte:254-266`, `apps/ttb-studio/src/lib/client/jobs.ts:11-19`).
- The jobs route calls `advanceJob`, so progress depends on someone polling (`apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts:15`).
- The Séance polls `/api/studio/seances/<id>` every 4 s and stops after 4 consecutive misses (`apps/ttb-studio/src/routes/seance/+page.svelte:127-150`).

## Why it matters

A closed tab stops advancing a job unless another poller exists; this is a behavior to keep in mind when reasoning about stuck jobs (inference from the call pattern, not verified at runtime).

## Examples in this codebase

- [[entities/mod-ttb-client-jobs]]
- [[entities/route-ttb-get-studio-jobs-id]]

## Connections

- **involves entities:** [[entities/mod-ttb-client-jobs]], [[entities/route-ttb-page]], [[entities/route-ttb-page-library-id]], [[entities/route-ttb-page-seance]], [[entities/route-ttb-get-studio-jobs-id]], [[entities/route-ttb-get-studio-seances-id]], [[entities/mod-studio-jobs]]
- **related concepts:** [[concepts/ttb-studio-api-surface]], [[concepts/hosted-generation-flow]]

## Sources

- `apps/ttb-studio/src/lib/client/jobs.ts`
- `apps/ttb-studio/src/routes/+page.svelte`

## See also

- [[concepts/studio-job-lifecycle]]: server-side job states, caps and deadline.
