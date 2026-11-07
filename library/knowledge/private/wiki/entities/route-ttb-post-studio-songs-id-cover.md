---
type: entity
title: "TTB Studio POST /api/studio/songs/[id]/cover"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-seal]]"
  - "[[entities/env-replicate-api-token]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: POST
route_path: "/api/studio/songs/[id]/cover"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts"
---

# TTB Studio POST /api/studio/songs/[id]/cover

## Overview

Re-conjures cover art, a paid Replicate call (`apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts:23-38`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Calls `guard` first; outside development it returns the gate 403, on a non-localhost host 403, and for writes a non-JSON body 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- 503 without a Replicate client (`apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts:28-29`); 201 `{song}` on success (`apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts:30-34`).
- Caller: `reconjure` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:151-170`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-cover]], [[entities/mod-studio-seal]], [[entities/env-replicate-api-token]]
- **used_by:** [[entities/route-ttb-page-library-id]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/[id]/cover/+server.ts`
