---
type: entity
title: "Vocal Fix GET /api/references/[session_id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vocal-fix-backend]]"
  - "[[entities/ep-vf-get-reference]]"
  - "[[entities/env-vocal-fix-api-url]]"
  - "[[entities/env-node-env]]"
used_by: []
last_commit_hash: "3997ab2"
tested_by: []
route_method: GET
route_path: "/api/references/[session_id]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/production-403-guard]]"
  - "[[concepts/reference-session]]"
  - "[[codegraph]]"
sources:
  - "apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts"
---

# Vocal Fix GET /api/references/[session_id]

## Overview

Reads one reference-session manifest (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:6-25`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- 403 unless `NODE_ENV` is `development` (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:7-8`); 404 unless the id matches a lower-case UUID pattern (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:3-5`, `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:9-10`).
- Proxies to the Python endpoint with `cache: no-store` and no timeout signal (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:11-21`).
- The page does not call this route; the code graph shows only the proxy edge.

## Connections

- **depends_on:** [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-get-reference]], [[entities/env-vocal-fix-api-url]], [[entities/env-node-env]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/production-403-guard]], [[concepts/reference-session]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts`
