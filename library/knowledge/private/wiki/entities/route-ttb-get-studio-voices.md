---
type: entity
title: "TTB Studio GET /api/studio/voices"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/voices/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-voices]]"
used_by:
  - "[[entities/route-ttb-page]]"
  - "[[entities/route-ttb-page-library-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/studio/voices"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/voices/+server.ts"
---

# TTB Studio GET /api/studio/voices

## Overview

Lists usable voices for pickers (`apps/ttb-studio/src/routes/api/studio/voices/+server.ts:5-21`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read; returns only `id`, `performer`, `created_at`, `profile`; model URLs and consent statements stay server-side (`apps/ttb-studio/src/routes/api/studio/voices/+server.ts:9-17`).
- Callers: summon page (`apps/ttb-studio/src/routes/+page.svelte:207`), song page (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:92-97`).

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-voices]]
- **used_by:** [[entities/route-ttb-page]], [[entities/route-ttb-page-library-id]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/voices/+server.ts`
