---
type: entity
title: "Vocal Fix GET /api/health"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/health/+server.ts"
language: ts
depends_on: []
used_by: []
last_commit_hash: "3997ab2"
tested_by: []
route_method: GET
route_path: "/api/health"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related: []
sources:
  - "apps/vocal-fix/src/routes/api/health/+server.ts"
---

# Vocal Fix GET /api/health

## Overview

Static health JSON (`apps/vocal-fix/src/routes/api/health/+server.ts:3-10`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Returns `status: ok`, `app: vocal-fix-saas`, `version: 0.2.0`, `public_upload_enabled: false`, `auth_ready: false` (`apps/vocal-fix/src/routes/api/health/+server.ts:3-10`).
- Since `f88cc09` the `/api/` hook applies the loopback host guard before this handler (`apps/vocal-fix/src/hooks.server.ts:6-9`). It reports process health only.

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/routes/api/health/+server.ts`
