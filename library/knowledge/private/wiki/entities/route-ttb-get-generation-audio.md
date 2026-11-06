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
used_by:
  - "[[entities/route-ttb-page]]"
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
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts"
---

# TTB Studio GET /api/generations/[id]/audio

## Overview

Streams verified audio for a completed fal job (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:9-29`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Gate 403 outside development (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:10-11`); only `fal.` UUID ids are accepted, else 404 (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:12-14`); 503 without `FAL_KEY` (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:15-20`).
- Resolves the media URL with `falAudioUrl`, fetches it without the API key and with `redirect: 'error'` and a 120 s timeout, then returns `verifiedAudioResponse` (`apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:22-25`).
- The page reaches this route through the dynamic `audio_url` (`apps/ttb-studio/src/routes/+page.svelte:109-112`); the code graph does not draw that edge because the URL is not a string literal.

## Connections

- **depends_on:** [[entities/mod-music-audio]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-gate]], [[entities/mod-music-jobs]], [[entities/env-fal-key]]
- **used_by:** [[entities/route-ttb-page]]
- **related:** [[concepts/hosted-generation-flow]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts`
