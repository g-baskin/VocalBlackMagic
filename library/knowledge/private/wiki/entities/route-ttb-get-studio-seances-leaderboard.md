---
type: entity
title: "TTB Studio GET /api/studio/seances/leaderboard"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/seances/leaderboard/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/route-ttb-studio-seances-deps]]"
used_by:
  - "[[entities/route-ttb-page-seance]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: GET
route_path: "/api/studio/seances/leaderboard"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-seance]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/seances/leaderboard/+server.ts"
---

# TTB Studio GET /api/studio/seances/leaderboard

## Overview

Returns the séance leaderboard (`apps/ttb-studio/src/routes/api/studio/seances/leaderboard/+server.ts:6-13`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read; returns `{leaderboard}` from `seanceLeaderboard` (`apps/ttb-studio/src/routes/api/studio/seances/leaderboard/+server.ts:7-12`).
- Caller: `loadBoard` (`apps/ttb-studio/src/routes/seance/+page.svelte:81-88`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-seance]], [[entities/route-ttb-studio-seances-deps]]
- **used_by:** [[entities/route-ttb-page-seance]]
- **related:** [[concepts/ttb-seance]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/seances/leaderboard/+server.ts`
