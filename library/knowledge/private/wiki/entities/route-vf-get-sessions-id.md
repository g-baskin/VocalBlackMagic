---
type: entity
title: "Vocal Fix GET /api/sessions/[id]"
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
  - "[[entities/mod-vf-storage]]"
used_by:
  - "[[entities/route-vf-page-session-id]]"
  - "[[entities/route-vf-page-session-id-forge]]"
  - "[[entities/route-vf-page-session-id-gold]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/sessions/[id]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/production-403-guard]]"
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts"
---

# Vocal Fix GET /api/sessions/[id]

## Overview

Reads one session manifest (`apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts:6-16`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Development only via `disabledResponse`; loopback enforced by the hook (`apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts:6-8`, `apps/vocal-fix/src/hooks.server.ts:6-9`).
- Returns the full manifest (including performer, consent and audit) with `no-store` (`apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts:9-15`).
- Any loopback caller who knows the UUID can read it; there is no user or ownership check.

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-storage]]
- **used_by:** [[entities/route-vf-page-session-id]], [[entities/route-vf-page-session-id-forge]], [[entities/route-vf-page-session-id-gold]]
- **related:** [[concepts/production-403-guard]], [[concepts/reference-session]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/[id]/+server.ts`
