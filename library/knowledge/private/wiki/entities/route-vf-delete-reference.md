---
type: entity
title: "Vocal Fix DELETE /api/references/[session_id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vocal-fix-backend]]"
  - "[[entities/ep-vf-delete-reference]]"
  - "[[entities/env-vocal-fix-api-url]]"
  - "[[entities/env-node-env]]"
used_by:
  - "[[entities/route-vf-page]]"
last_commit_hash: "3997ab2"
tested_by: []
route_method: DELETE
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

# Vocal Fix DELETE /api/references/[session_id]

## Overview

Deletes one reference session (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:26-45`).

## Signature / Definition

```ts
export const DELETE: RequestHandler
```

## Behavior

- 403 unless `NODE_ENV` is `development` (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:27-28`); 404 for a non-UUID id (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:29-30`).
- Proxies a DELETE without a timeout signal (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:31-41`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-delete-reference]], [[entities/env-vocal-fix-api-url]], [[entities/env-node-env]]
- **used_by:** [[entities/route-vf-page]]
- **related:** [[concepts/production-403-guard]], [[concepts/reference-session]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts`
