---
type: concept
title: "Vocal Fix job runner"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "JobRunner"
  - "async jobs"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/lib/server/jobs.ts"
---

# Vocal Fix job runner

## Definition

In-process queue for repair and forge work with status persisted to disk.

## How it works

- Status files under `<data>/vocal-fix/jobs` survive restarts; interrupted jobs become failed (`apps/vocal-fix/src/lib/server/jobs.ts:43-97`).
- Concurrency: two running, one forge (`apps/vocal-fix/src/lib/server/jobs.ts:51-55`, `apps/vocal-fix/src/lib/server/jobs.ts:131-140`).
- Cancellation aborts the signal, which kills ffmpeg and cancels Replicate predictions (`apps/vocal-fix/src/lib/server/jobs.ts:194-207`, `apps/vocal-fix/src/lib/server/media.ts:42-44`, `apps/vocal-fix/src/lib/server/replicate.ts:140-143`).

## Why it matters

Limits are per process; they are GPU and cost brakes only for a single dev server, not a distributed guarantee.

## Examples in this codebase

- [[entities/mod-vf-jobs]]

## Connections

- **involves entities:** [[entities/mod-vf-jobs]], [[entities/route-vf-get-sessions-id-jobs-job]], [[entities/route-vf-delete-sessions-id-jobs-job]]
- **related concepts:** [[concepts/vocal-fix-repair-pipeline]]

## Sources

- `apps/vocal-fix/src/lib/server/jobs.ts`
