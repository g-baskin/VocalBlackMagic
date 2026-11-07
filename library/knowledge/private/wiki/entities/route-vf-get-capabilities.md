---
type: entity
title: "Vocal Fix GET /api/capabilities"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/capabilities/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-chain]]"
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-forge]]"
  - "[[entities/mod-vf-replicate]]"
  - "[[entities/mod-vf-service]]"
  - "[[entities/mod-vf-svc]]"
used_by:
  - "[[entities/route-vf-page-session-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/capabilities"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/production-403-guard]]"
sources:
  - "apps/vocal-fix/src/routes/api/capabilities/+server.ts"
---

# Vocal Fix GET /api/capabilities

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior contract: proxied the Python `/api/capabilities` via `backend.ts`. New contract: builds the response in SvelteKit from local modules (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:9-28`).

## Overview

Describes what the local pipeline can do (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:1-28`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Answers locally; no Python call (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:9-28`).
- Reports `processing_allowed`, `hosted_ready` (dev and token present), presets, model refs with cost estimates, the rights and consent statements and limits, with `no-store` (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:12-27`).
- No dev gate on this route; the API hook still enforces loopback (`apps/vocal-fix/src/hooks.server.ts:6-9`). It does not expose the token, only whether one exists.

## Prior behavior (stale)

> [!stale]
> Behavior changed in commit `f88cc09` (2026-11-06). Reason: capabilities now computed in-process.

- Proxied `VOCAL_FIX_API_URL` (fallback `http://127.0.0.1:8001`) + `/api/capabilities` with a 3 s timeout; 503 via `upstreamUnavailable` (cited lines 3-16 at `3997ab2`). Linked [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-get-capabilities]], [[entities/env-vocal-fix-api-url]].
- Used by [[entities/route-vf-page]]; the home page no longer calls it.

## Connections

- **depends_on:** [[entities/mod-vf-chain]], [[entities/mod-vf-gate]], [[entities/mod-vf-forge]], [[entities/mod-vf-replicate]], [[entities/mod-vf-service]], [[entities/mod-vf-svc]]
- **used_by:** [[entities/route-vf-page-session-id]]
- **related:** [[concepts/production-403-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/capabilities/+server.ts`
