---
type: entity
title: "TTB Studio GET /api/generations/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/generations/[id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-music-jobs]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-generation-job]]"
  - "[[entities/env-fal-key]]"
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "29c84e4"
tested_by: []
route_method: GET
route_path: "/api/generations/[id]"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/api/generations/[id]/+server.ts"
---

# TTB Studio GET /api/generations/[id]

## Overview

Polls a fal ACE-Step job (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:9-41`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Gate 403 outside development (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:10-11`); `lyria.` ids return 404 because Lyria results are not stored (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:13-17`); unknown or non-UUID ids return 404 (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:18-19`); 503 without `FAL_KEY` (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:20-25`).
- Maps `falStatus` into a `GenerationJob`; on completion sets `audio_url` to `/api/generations/<job_id>/audio` (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:27-37`).

## Connections

- **depends_on:** [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-gate]], [[entities/mod-music-jobs]], [[entities/mod-contracts]], [[entities/contract-generation-job]], [[entities/env-fal-key]]
- **used_by:** [[entities/route-ttb-page]]
- **related:** [[concepts/hosted-generation-flow]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/api/generations/[id]/+server.ts`
