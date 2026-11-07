---
type: entity
title: "Vocal Fix DELETE /api/sessions/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts"
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
route_method: DELETE
route_path: "/api/sessions/[id]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-mutation-guard]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts"
---

# Vocal Fix DELETE /api/sessions/[id]

## Overview

Deletes a session and everything derived from it (`apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts:18-27`).

## Signature / Definition

```ts
export const DELETE: RequestHandler
```

## Behavior

- `guardMutation` with `json: false` (`apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts:19-20`).
- Calls `remove`, which cancels jobs, deletes job records, linked voice files and the session directory; returns 204 (`apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts:21-26`, `apps/vocal-fix/src/lib/server/service.ts:182-189`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-service]]
- **used_by:** [[entities/route-vf-page-session-id]]
- **related:** [[concepts/vocal-fix-mutation-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts`
