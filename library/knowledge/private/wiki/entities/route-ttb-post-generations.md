---
type: entity
title: "TTB Studio POST /api/generations"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/generations/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-jobs]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-prompt]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-generation-request]]"
  - "[[entities/contract-generation-job]]"
  - "[[entities/contract-validate-generation-request]]"
  - "[[entities/mod-ttb-studio-env]]"
  - "[[entities/env-fal-key]]"
  - "[[entities/env-gemini-api-key]]"
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "29c84e4"
tested_by: []
route_method: POST
route_path: "/api/generations"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[concepts/dev-only-generation-gate]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/api/generations/+server.ts"
---

# TTB Studio POST /api/generations

## Overview

Starts a hosted song generation with ACE-Step (async, fal queue) or Lyria 3.5 (synchronous) (`apps/ttb-studio/src/routes/api/generations/+server.ts:22-114`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Returns the gate 403 outside development (`apps/ttb-studio/src/routes/api/generations/+server.ts:23-24`), 415 for non-JSON (`apps/ttb-studio/src/routes/api/generations/+server.ts:25-26`), 400 for invalid JSON (`apps/ttb-studio/src/routes/api/generations/+server.ts:28-32`), and 422 for wrong field types or a `validateGenerationRequest` error (`apps/ttb-studio/src/routes/api/generations/+server.ts:33-46`).
- `ace-step`: 503 without `FAL_KEY`; 422 on ACE-Step limits; for a full song without lyrics, writes them with Gemini (503 without `GEMINI_API_KEY`); submits to fal and returns 202 with `job_id` `fal.<uuid>` and `status: queued` (`apps/ttb-studio/src/routes/api/generations/+server.ts:49-91`).
- If fal submission fails after lyrics were written, the error response includes the written lyrics so a retry can reuse them (`apps/ttb-studio/src/routes/api/generations/+server.ts:76-84`).
- `lyria-3.5`: 503 without `GEMINI_API_KEY`; otherwise returns 200 with `status: completed`, inline audio and lyrics; the id is `lyria.<random uuid>` and nothing is stored (`apps/ttb-studio/src/routes/api/generations/+server.ts:93-109`).
- Other engines return 501 (`apps/ttb-studio/src/routes/api/generations/+server.ts:110`); thrown errors go through `errorResponse` (`apps/ttb-studio/src/routes/api/generations/+server.ts:111-113`).

## Connections

- **depends_on:** [[entities/mod-music-gate]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-jobs]], [[entities/mod-music-lyricist]], [[entities/mod-music-lyria]], [[entities/mod-music-prompt]], [[entities/mod-contracts]], [[entities/contract-generation-request]], [[entities/contract-generation-job]], [[entities/contract-validate-generation-request]], [[entities/mod-ttb-studio-env]], [[entities/env-fal-key]], [[entities/env-gemini-api-key]]
- **used_by:** [[entities/route-ttb-page]]
- **related:** [[concepts/hosted-generation-flow]], [[concepts/dev-only-generation-gate]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/api/generations/+server.ts`
