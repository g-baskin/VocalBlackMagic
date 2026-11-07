---
type: entity
title: "TTB Studio GET /api/studio/seances"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/seances/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/route-ttb-studio-seances-deps]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
route_method: GET
route_path: "/api/studio/seances"
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
  - "apps/ttb-studio/src/routes/api/studio/seances/+server.ts"
---

# TTB Studio GET /api/studio/seances

## Overview

Lists séances (`apps/ttb-studio/src/routes/api/studio/seances/+server.ts:7-11`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Guarded read; returns `{seances}` from `listSeances(seanceDeps(fetch))` (`apps/ttb-studio/src/routes/api/studio/seances/+server.ts:8-10`).
- No browser caller found in `apps/ttb-studio/src`.

## Connections

- **depends_on:** [[entities/mod-studio-context]], [[entities/mod-studio-seance]], [[entities/route-ttb-studio-seances-deps]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/ttb-seance]], [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/seances/+server.ts`
