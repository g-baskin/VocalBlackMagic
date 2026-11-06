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
  - "[[entities/mod-vocal-fix-backend]]"
  - "[[entities/ep-vf-get-capabilities]]"
  - "[[entities/env-vocal-fix-api-url]]"
used_by:
  - "[[entities/route-vf-page]]"
last_commit_hash: "3997ab2"
tested_by: []
route_method: GET
route_path: "/api/capabilities"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[codegraph]]"
sources:
  - "apps/vocal-fix/src/routes/api/capabilities/+server.ts"
---

# Vocal Fix GET /api/capabilities

## Overview

Proxies the Python capabilities endpoint (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:3-16`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Fetches `VOCAL_FIX_API_URL` (fallback `http://127.0.0.1:8001`) + `/api/capabilities` with a 3 s timeout and `no-store` (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:5-11`); returns `passthrough` or 503 via `upstreamUnavailable` (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:12-15`).
- It has no NODE_ENV guard (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:3-16`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-get-capabilities]], [[entities/env-vocal-fix-api-url]]
- **used_by:** [[entities/route-vf-page]]
- **related:** [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/routes/api/capabilities/+server.ts`
