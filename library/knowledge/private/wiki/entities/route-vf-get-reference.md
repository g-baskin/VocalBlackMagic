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
last_commit_hash: "f88cc09"
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
sources:
  - "apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts"
---

# Vocal Fix GET /api/references/[session_id]

## Overview

Legacy proxy read of a Python reference session (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:6-25`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- 403 unless development (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:7-8`); 404 unless a lower-case UUID (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:3-5`, `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:9-10`).
- Proxies to Python with `cache: no-store`, no timeout (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:11-24`); the API hook now adds the loopback guard (`apps/vocal-fix/src/hooks.server.ts:6-9`).
- No caller in the app. See [[questions/vocal-fix-legacy-reference-routes]].

## Connections

- **depends_on:** [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-get-reference]], [[entities/env-vocal-fix-api-url]], [[entities/env-node-env]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/production-403-guard]], [[concepts/reference-session]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts`
