---
type: entity
title: "Vocal Fix DELETE /api/sessions/[id]/jobs/[job]"
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
used_by:
  - "[[entities/route-vf-page-session-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: DELETE
route_path: "/api/sessions/[id]/jobs/[job]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-job-runner]]"
  - "[[concepts/vocal-fix-mutation-guard]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts"
---

# Vocal Fix DELETE /api/sessions/[id]/jobs/[job]

## Overview

Cancels a queued or running job (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:19-24`).

## Signature / Definition

```ts
export const DELETE: RequestHandler
```

## Behavior

- `guardMutation` with `json: false` (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:20-21`); 409 unless a live job of that session was cancelled; else 202 `{cancelled: true}` (`apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts:22-23`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-jobs]]
- **used_by:** [[entities/route-vf-page-session-id]]
- **related:** [[concepts/vocal-fix-job-runner]], [[concepts/vocal-fix-mutation-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/[id]/jobs/[job]/+server.ts`
