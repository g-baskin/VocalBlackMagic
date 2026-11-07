---
type: entity
title: "lib/server/jobs.ts (JobRunner)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/jobs.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-errors]]"
used_by:
  - "[[entities/mod-vf-service]]"
  - "[[entities/route-vf-get-sessions-id-jobs-job]]"
  - "[[entities/route-vf-delete-sessions-id-jobs-job]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - jobs
related:
  - "[[concepts/vocal-fix-job-runner]]"
sources:
  - "apps/vocal-fix/src/lib/server/jobs.ts"
---

# lib/server/jobs.ts (JobRunner)

## Overview

In-process async job queue with on-disk status (`apps/vocal-fix/src/lib/server/jobs.ts:1-239`).

## Signature / Definition

```ts
export class JobRunner { recover(); start(sessionDir, sessionId, kind, stages, work); get(sessionDir, id); cancel(sessionId, id); cancelSession(sessionId); removeSession(sessionId); idle(sessionId) }
```

## Behavior

- Jobs persist as `<data>/vocal-fix/jobs/<id>.json`; ids must match `job-<uuid>` (`apps/vocal-fix/src/lib/server/jobs.ts:22`, `apps/vocal-fix/src/lib/server/jobs.ts:43-69`).
- At most two jobs run at once and at most one forge; others stay queued (`apps/vocal-fix/src/lib/server/jobs.ts:51-55`, `apps/vocal-fix/src/lib/server/jobs.ts:124-140`).
- `recover` marks jobs left queued or running as failed after a restart (`apps/vocal-fix/src/lib/server/jobs.ts:71-97`).
- `cancel` aborts only if the job belongs to the given session (`apps/vocal-fix/src/lib/server/jobs.ts:194-207`); `removeSession` deletes a session's job files (`apps/vocal-fix/src/lib/server/jobs.ts:214-232`).
- `get` ignores its session argument and does not check ownership; the route checks `session_id` afterwards (`apps/vocal-fix/src/lib/server/jobs.ts:184-192`).

## Connections

- **depends_on:** [[entities/mod-vf-errors]]
- **used_by:** [[entities/mod-vf-service]], [[entities/route-vf-get-sessions-id-jobs-job]], [[entities/route-vf-delete-sessions-id-jobs-job]]
- **related:** [[concepts/vocal-fix-job-runner]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/jobs.ts`
