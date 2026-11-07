---
type: entity
title: "TTB Studio GET /api/health"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/health/+server.ts"
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
  - ttb-studio
  - sveltekit-route
related:
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/api/health/+server.ts"
---

# TTB Studio GET /api/health

## Overview

Static health response (`apps/ttb-studio/src/routes/api/health/+server.ts:1-10`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Returns `status: ok`, `app: ttb-studio-saas`, `version: 0.2.0`, `auth_ready: false`, `paid_generation_ready: false` (`apps/ttb-studio/src/routes/api/health/+server.ts:4-10`). Process health only; unchanged at HEAD.

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/api/health/+server.ts`
