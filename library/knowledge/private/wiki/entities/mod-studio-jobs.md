---
type: entity
title: "studio/jobs.ts (file-backed job store and poller)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/jobs.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-music-audio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-replicate]]"
used_by:
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/route-ttb-get-studio-jobs-id]]"
  - "[[entities/route-ttb-delete-studio-jobs-id]]"
  - "[[entities/test-studio-studio]]"
  - "[[entities/test-studio-edit]]"
  - "[[entities/test-studio-review]]"
  - "[[entities/test-studio-seal]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-studio]]"
  - "[[entities/test-studio-edit]]"
  - "[[entities/test-studio-review]]"
  - "[[entities/test-studio-seal]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-job-lifecycle]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/jobs.ts"
---

# studio/jobs.ts (file-backed job store and poller)

## Overview

Persists studio jobs under `<data>/studio/jobs/<id>.json`, polls Replicate, fal and the engine, stores verified audio as library songs, and enforces spend caps and timeouts.

## Signature / Definition

```ts
export interface SongPlan; export interface JobTask; export interface JobRecord; export interface JobContext
export const isJobId; export async function loadJob(ctx, id): Promise<JobRecord>
export function publicJob(job: JobRecord): StudioJob
export const maxActiveJobs = 3; export const seanceMaxActiveJobs = 4
export async function assertJobCapacity(ctx, limit?): Promise<void>
export async function recordJob(ctx, kind, plan, tasks); export async function recordFinishedJob(ctx, kind, plan, songIds)
export async function submitReplicateTasks(deps, model, inputs): Promise<JobTask[]>
export async function storeSong(ctx, plan, take, main, stems?): Promise<SongMeta>
export function transientEngineError(error: unknown): boolean
export async function maybeCover(ctx, job, songId): Promise<void>
export async function advanceJob(ctx, id): Promise<StudioJob>
export async function cancelJob(ctx, id): Promise<StudioJob>
```

## Behavior

- Jobs have a 20 minute deadline and locks go stale after 10 minutes (`apps/ttb-studio/src/lib/server/studio/jobs.ts:74-75`); ids are UUIDs, else 404 (`apps/ttb-studio/src/lib/server/studio/jobs.ts:79-82`).
- Each job kind has staged labels (summon, bind, plus upload for derived work) (`apps/ttb-studio/src/lib/server/studio/jobs.ts:84-119`); saves are atomic tmp-then-rename (`apps/ttb-studio/src/lib/server/studio/jobs.ts:121-126`).
- `publicJob` omits tasks, plan and deadline (`apps/ttb-studio/src/lib/server/studio/jobs.ts:137-148`).
- `assertJobCapacity` counts running, unexpired jobs and refuses with 429 at the limit (default 3) (`apps/ttb-studio/src/lib/server/studio/jobs.ts:150-181`).
- `submitReplicateTasks` keeps takes already started if a later one fails (`apps/ttb-studio/src/lib/server/studio/jobs.ts:222-244`).
- `storeSong` writes only audio passing `verifiedAudioResponse`, names takes, carries voice, runner and seance tags, inherits a parent cover, and removes the folder on failure (`apps/ttb-studio/src/lib/server/studio/jobs.ts:246-264`, `apps/ttb-studio/src/lib/server/studio/jobs.ts:267-309`).
- Stems jobs require all four Demucs stems (`apps/ttb-studio/src/lib/server/studio/jobs.ts:317-327`).
- `advanceTask` polls engine, Replicate or fal; fal audio is fetched with `redirect: error` (`apps/ttb-studio/src/lib/server/studio/jobs.ts:346-403`).
- `maybeCover` only covers `create` jobs with `cover: true`, and a cover failure never fails the song (`apps/ttb-studio/src/lib/server/studio/jobs.ts:406-417`).
- `advanceJob` is lock-guarded, keeps tasks running on 429/503/504 or timeouts, cancels and fails tasks past the deadline, then settles (`apps/ttb-studio/src/lib/server/studio/jobs.ts:419-438`, `apps/ttb-studio/src/lib/server/studio/jobs.ts:462-504`).
- `cancelJob` cancels running provider work and is a 409 while another poll holds the lock (`apps/ttb-studio/src/lib/server/studio/jobs.ts:506-526`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-studio-runner-engine]], [[entities/mod-music-audio]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-studio-cover]], [[entities/mod-studio-library]], [[entities/mod-studio-replicate]]
- **used_by:** [[entities/mod-studio-create]], [[entities/mod-studio-derive]], [[entities/mod-studio-edit]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-runner-routed]], [[entities/route-ttb-get-studio-jobs-id]], [[entities/route-ttb-delete-studio-jobs-id]], [[entities/test-studio-studio]], [[entities/test-studio-edit]], [[entities/test-studio-review]], [[entities/test-studio-seal]]
- **related:** [[concepts/studio-job-lifecycle]]

## Tested by

- [[entities/test-studio-studio]]
- [[entities/test-studio-edit]]
- [[entities/test-studio-review]]
- [[entities/test-studio-seal]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/jobs.ts`
