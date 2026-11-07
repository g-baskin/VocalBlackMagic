---
type: entity
title: "Vocal Fix GET /api/sessions/[id]/jobs/[job]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-vf-jobs]]"
  - "[[entities/mod-vf-storage]]"
used_by:
  - "[[entities/route-vf-page-session-id]]"
  - "[[entities/route-vf-page-session-id-forge]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/sessions/[id]/jobs/[job]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-job-runner]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts"
---

# Vocal Fix GET /api/sessions/[id]/jobs/[job]

## Overview

Polls one job (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:6-17`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Development only (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:7-8`); validates the session id via `sessionDir` and loads the job (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:10-11`).
- 404 unless the job's `session_id` equals the path id (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:12`); returns it with `no-store` (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:13`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-jobs]], [[entities/mod-vf-storage]]
- **used_by:** [[entities/route-vf-page-session-id]], [[entities/route-vf-page-session-id-forge]]
- **related:** [[concepts/vocal-fix-job-runner]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts`
