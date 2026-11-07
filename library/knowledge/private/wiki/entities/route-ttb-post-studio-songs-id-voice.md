---
type: entity
title: "TTB Studio POST /api/studio/songs/[id]/voice"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/voice/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-voices]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: POST
route_path: "/api/studio/songs/[id]/voice"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/voice/+server.ts"
---

# TTB Studio POST /api/studio/songs/[id]/voice

## Overview

Starts a voice conversion job with a consented voice (`apps/ttb-studio/src/routes/api/studio/songs/[id]/voice/+server.ts:12-31`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 422 unless `voice_id` names a usable voice, i.e. ready with own-voice consent per the message (`apps/ttb-studio/src/routes/api/studio/songs/[id]/voice/+server.ts:15-22`); 202 `{job}` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/voice/+server.ts:23-27`).
- Called through `startRitual`, which posts to `/api/studio/songs/<id>/<path>` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:109-129`); the `voice` literal is at `apps/ttb-studio/src/routes/library/[id]/+page.svelte:435`.

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-derive]], [[entities/mod-studio-voices]]
- **used_by:** [[entities/route-ttb-page-library-id]]
- **related:** [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/voice/+server.ts`
