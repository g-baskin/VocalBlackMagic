---
type: entity
title: "Vocal Fix POST /api/sessions/[id]/diagnose"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/sessions/[id]/diagnose/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-vf-service]]"
used_by:
  - "[[entities/route-vf-page]]"
  - "[[entities/route-vf-page-session-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: POST
route_path: "/api/sessions/[id]/diagnose"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-mutation-guard]]"
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/[id]/diagnose/+server.ts"
---

# Vocal Fix POST /api/sessions/[id]/diagnose

## Overview

Session diagnose action (`apps/vocal-fix/src/routes/api/sessions/[id]/diagnose/+server.ts:6-14`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- `guardMutation` with `json: true`: loopback, development only, `application/json` (`apps/vocal-fix/src/routes/api/sessions/[id]/diagnose/+server.ts:7-8`).
- The body is never read; it re-diagnoses every recording and returns the updated manifest (`apps/vocal-fix/src/routes/api/sessions/[id]/diagnose/+server.ts:9-10`, `apps/vocal-fix/src/lib/server/service.ts:199-210`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-service]]
- **used_by:** [[entities/route-vf-page]], [[entities/route-vf-page-session-id]]
- **related:** [[concepts/vocal-fix-mutation-guard]], [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/[id]/diagnose/+server.ts`
