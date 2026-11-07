---
type: entity
title: "TTB Studio GET /api/studio/songs/[id]/audio"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-range]]"
used_by:
  - "[[entities/mod-ttb-client-api]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/studio/songs/[id]/audio"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts"
---

# TTB Studio GET /api/studio/songs/[id]/audio

## Overview

Serves a stored song or stem with range support (`apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts:6-29`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read; 404 for an unknown `stem` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts:9-10`).
- `download=1` adds a filename from the song title (`apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts:14-18`); the body comes from `fileResponse` with the request `range` header (`apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts:19-25`).
- URL built by `audioUrl` (`apps/ttb-studio/src/lib/client/api.ts:11-12`); the code graph cannot draw literal edges for it.

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-library]], [[entities/mod-studio-range]]
- **used_by:** [[entities/mod-ttb-client-api]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts`
