---
type: entity
title: "Vocal Fix POST /api/sessions/[id]/repair"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/sessions/[id]/repair/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-vf-service]]"
used_by:
  - "[[entities/route-vf-page-session-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: POST
route_path: "/api/sessions/[id]/repair"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-mutation-guard]]"
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/[id]/repair/+server.ts"
---

# Vocal Fix POST /api/sessions/[id]/repair

## Overview

Session repair action (`apps/vocal-fix/src/routes/api/sessions/[id]/repair/+server.ts:6-16`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- `guardMutation` with `json: true`: loopback, development only, `application/json` (`apps/vocal-fix/src/routes/api/sessions/[id]/repair/+server.ts:7-8`).
- 400 unless the body is a JSON object (`apps/vocal-fix/src/routes/api/sessions/[id]/repair/+server.ts:9-10`); calls `startRepair` and returns 202 (`apps/vocal-fix/src/routes/api/sessions/[id]/repair/+server.ts:11-15`).
- Unknown preset is 422; isolate or enhance without a token is 503 (`apps/vocal-fix/src/lib/server/service.ts:283-287`). Hosted stages spend Replicate credit with no spend cap.

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-service]]
- **used_by:** [[entities/route-vf-page-session-id]]
- **related:** [[concepts/vocal-fix-mutation-guard]], [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/[id]/repair/+server.ts`
