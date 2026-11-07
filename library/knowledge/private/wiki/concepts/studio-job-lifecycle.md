---
type: concept
title: "Studio job lifecycle"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "studio jobs"
  - "advanceJob"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - studio
related:
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/studio-song-library]]"
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/jobs.ts"
---

# Studio job lifecycle

## Definition

Paid studio work is a file-backed job: submitted provider tasks, polled on read, stored as verified library songs, with a spend cap and a 20 minute deadline.

## How it works

- `recordJob` writes the job after submission with stages and a deadline (`apps/ttb-studio/src/lib/server/studio/jobs.ts:184-205`).
- At most 3 running jobs, 4 for seance takes (`apps/ttb-studio/src/lib/server/studio/jobs.ts:150-181`).
- `advanceJob` polls under a directory lock and settles status from task outcomes (`apps/ttb-studio/src/lib/server/studio/jobs.ts:419-438`, `apps/ttb-studio/src/lib/server/studio/jobs.ts:462-504`).
- Audio is stored only after `verifiedAudioResponse` (`apps/ttb-studio/src/lib/server/studio/jobs.ts:246-264`); synchronous results use `recordFinishedJob` (`apps/ttb-studio/src/lib/server/studio/jobs.ts:208-220`).

## Why it matters

The studio never reports success without verified audio on disk, and runaway spend is capped.

## Examples in this codebase

- [[entities/mod-studio-jobs]]
- [[entities/mod-studio-create]]

## Connections

- **involves entities:** [[entities/mod-studio-jobs]], [[entities/mod-studio-create]], [[entities/mod-studio-derive]], [[entities/mod-studio-edit]], [[entities/mod-studio-cover]], [[entities/mod-studio-library]], [[entities/route-ttb-get-studio-jobs-id]], [[entities/route-ttb-delete-studio-jobs-id]]
- **related concepts:** [[concepts/studio-song-library]], [[concepts/studio-models-and-runners]]

## Sources

- `apps/ttb-studio/src/lib/server/studio/jobs.ts`

## See also

- [[concepts/ttb-job-polling]]: browser polling that advances jobs.
