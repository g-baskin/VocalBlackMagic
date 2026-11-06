---
type: entity
title: "TTB Studio GET /api/capabilities"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/capabilities/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-music-capabilities]]"
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-ttb-studio-env]]"
  - "[[entities/env-fal-key]]"
  - "[[entities/env-gemini-api-key]]"
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "29c84e4"
tested_by: []
route_method: GET
route_path: "/api/capabilities"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/api/capabilities/+server.ts"
---

# TTB Studio GET /api/capabilities

## Overview

Reports which hosted engines are usable (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:7-15`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Calls `buildCapabilities` with key presence from `configuredKey(FAL_KEY)` and `configuredKey(GEMINI_API_KEY)` and `generationAllowed()` (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:9-13`).
- Responds with `cache-control: no-store` (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:14`). Not gated: it answers in production too, reporting `disabled outside development`.

## Connections

- **depends_on:** [[entities/mod-music-capabilities]], [[entities/mod-music-gate]], [[entities/mod-ttb-studio-env]], [[entities/env-fal-key]], [[entities/env-gemini-api-key]]
- **used_by:** [[entities/route-ttb-page]]
- **related:** [[concepts/dev-only-generation-gate]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/api/capabilities/+server.ts`
