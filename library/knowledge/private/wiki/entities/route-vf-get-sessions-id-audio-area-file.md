---
type: entity
title: "Vocal Fix GET /api/sessions/[id]/audio/[area]/[file]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-vf-range]]"
  - "[[entities/mod-vf-storage]]"
used_by:
  - "[[entities/route-vf-page-session-id]]"
  - "[[entities/route-vf-page-session-id-forge]]"
  - "[[entities/route-vf-page-session-id-gold]]"
  - "[[entities/mod-vf-client]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/sessions/[id]/audio/[area]/[file]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/production-403-guard]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts"
---

# Vocal Fix GET /api/sessions/[id]/audio/[area]/[file]

## Overview

Streams an original or derived file (`apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts:20-40`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Development only (`apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts:21-22`); `area` must be `originals` or `derived` (`apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts:24-25`).
- Reads the manifest first, then resolves the file with `filePath`, which rejects traversal and bad names with 404 (`apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts:26-29`, `apps/vocal-fix/src/lib/server/storage.ts:87-94`).
- Content type from an extension map, defaulting to octet-stream, served with range support (`apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts:7-18`, `apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts:30-36`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-range]], [[entities/mod-vf-storage]]
- **used_by:** [[entities/route-vf-page-session-id]], [[entities/route-vf-page-session-id-forge]], [[entities/route-vf-page-session-id-gold]], [[entities/mod-vf-client]]
- **related:** [[concepts/production-403-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/[id]/audio/[area]/[file]/+server.ts`
