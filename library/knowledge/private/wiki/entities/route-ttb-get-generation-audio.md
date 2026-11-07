---
type: entity
title: "TTB Studio GET /api/generations/[id]/audio"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-music-audio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-music-jobs]]"
  - "[[entities/env-fal-key]]"
used_by: []
last_commit_hash: "29c84e4"
tested_by: []
route_method: GET
route_path: "/api/generations/[id]/audio"
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
  - "apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts"
---

# TTB Studio GET /api/generations/[id]/audio

> [!contradiction]
> Contract changed between `29c84e4` and `f88cc09` (HEAD `b58d457`).
> Prior contract: used by [[entities/route-ttb-page]].
> New contract: no caller in source; the page moved to `/api/studio/*` (`apps/ttb-studio/src/routes/+page.svelte:288-291`). Handler code unchanged since `29c84e4`.

## Overview

Legacy verified audio stream for a completed fal job (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:9-29`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Gate 403 (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:10-11`); only `fal.` UUID ids, else 404 (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:12-14`); 503 without `FAL_KEY` (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:15-20`).
- Fetches the `falAudioUrl` media without the key, `redirect: error`, 120 s timeout, then `verifiedAudioResponse` (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:22-25`).
- Only reachable through the `audio_url` built at `apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:36`. No browser caller at HEAD: a search of `apps/ttb-studio/src` finds `/api/generations` only in this route family and a test request URL (`apps/ttb-studio/src/lib/server/music/music.test.ts:311`).
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `f88cc09`: used_by [[entities/route-ttb-page]].

## Connections

- **depends_on:** [[entities/mod-music-audio]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-gate]], [[entities/mod-music-jobs]], [[entities/env-fal-key]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/hosted-generation-flow]], [[concepts/dev-only-generation-gate]], [[concepts/ttb-legacy-generation-api]], [[questions/ttb-retire-legacy-generations-routes]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts`
