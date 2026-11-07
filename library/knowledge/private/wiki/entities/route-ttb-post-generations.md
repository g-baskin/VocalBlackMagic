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
used_by: []
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
  - "[[concepts/ttb-legacy-generation-api]]"
  - "[[questions/ttb-retire-legacy-generations-routes]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/api/generations/+server.ts"
---

# TTB Studio POST /api/generations

> [!contradiction]
> Contract changed between `29c84e4` and `f88cc09` (HEAD `b58d457`).
> Prior contract: used by [[entities/route-ttb-page]].
> New contract: no caller in source; the page moved to `/api/studio/*` (`apps/ttb-studio/src/routes/+page.svelte:288-291`). Handler code unchanged since `29c84e4`.

## Overview

Legacy hosted generation entry: ACE-Step (async, fal queue) or Lyria 3.5 (synchronous) (`apps/ttb-studio/src/routes/api/generations/+server.ts:22-114`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Returns the gate 403 outside development (`apps/ttb-studio/src/routes/api/generations/+server.ts:23-24`), 415 for non-JSON (`apps/ttb-studio/src/routes/api/generations/+server.ts:25-26`), 400 for invalid JSON (`apps/ttb-studio/src/routes/api/generations/+server.ts:28-32`), and 422 for wrong field types or a `validateGenerationRequest` error (`apps/ttb-studio/src/routes/api/generations/+server.ts:33-46`). It does not apply the studio localhost check.
- `ace-step`: 503 without `FAL_KEY`; 422 on ACE-Step limits; Gemini writes missing full-song lyrics (503 without `GEMINI_API_KEY`); returns 202 `fal.<uuid>` `queued` (`apps/ttb-studio/src/routes/api/generations/+server.ts:49-91`), echoing written lyrics on a failed submit (`apps/ttb-studio/src/routes/api/generations/+server.ts:76-84`).
- `lyria-3.5`: 503 without `GEMINI_API_KEY`; otherwise 200 `completed` with inline audio, id `lyria.<uuid>`, nothing stored (`apps/ttb-studio/src/routes/api/generations/+server.ts:93-109`). Other engines 501 (`apps/ttb-studio/src/routes/api/generations/+server.ts:110`); thrown errors use `errorResponse` (`apps/ttb-studio/src/routes/api/generations/+server.ts:111-113`).
- No browser caller at HEAD: a search of `apps/ttb-studio/src` finds `/api/generations` only in this route family and a test request URL (`apps/ttb-studio/src/lib/server/music/music.test.ts:311`).
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `f88cc09`: used_by [[entities/route-ttb-page]].

## Connections

- **depends_on:** [[entities/mod-music-gate]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-jobs]], [[entities/mod-music-lyricist]], [[entities/mod-music-lyria]], [[entities/mod-music-prompt]], [[entities/mod-contracts]], [[entities/contract-generation-request]], [[entities/contract-generation-job]], [[entities/contract-validate-generation-request]], [[entities/mod-ttb-studio-env]], [[entities/env-fal-key]], [[entities/env-gemini-api-key]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/hosted-generation-flow]], [[concepts/dev-only-generation-gate]], [[concepts/ttb-legacy-generation-api]], [[questions/ttb-retire-legacy-generations-routes]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/api/generations/+server.ts`
