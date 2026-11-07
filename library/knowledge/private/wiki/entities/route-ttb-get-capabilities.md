---
type: entity
title: "TTB Studio GET /api/capabilities"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/capabilities/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-music-capabilities]]"
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-ttb-studio-env]]"
  - "[[entities/env-fal-key]]"
  - "[[entities/env-gemini-api-key]]"
  - "[[entities/env-replicate-api-token]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/capabilities"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/ttb-legacy-generation-api]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/api/capabilities/+server.ts"
---

# TTB Studio GET /api/capabilities

> [!contradiction]
> Contract changed between `29c84e4` and `f88cc09` (HEAD `b58d457`).
> Prior contract: two key inputs; called by the page.
> New contract: also passes `replicateConfigured` (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:13`), so a Replicate token alone makes `generation_ready` true; no caller.

## Overview

Legacy capabilities report for the hosted engines (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:7-16`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Calls `buildCapabilities` with `FAL_KEY`, `GEMINI_API_KEY` and `REPLICATE_API_TOKEN` presence plus `generationAllowed()` (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:9-14`), with `cache-control: no-store` (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:15`). Not gated.
- No browser caller at HEAD; the UI reads [[entities/route-ttb-get-studio-capabilities]] (`apps/ttb-studio/src/routes/+page.svelte:227`).
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `b58d457`: reads only FAL_KEY and GEMINI_API_KEY; used_by [[entities/route-ttb-page]].

## Connections

- **depends_on:** [[entities/mod-music-capabilities]], [[entities/mod-music-gate]], [[entities/mod-ttb-studio-env]], [[entities/env-fal-key]], [[entities/env-gemini-api-key]], [[entities/env-replicate-api-token]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/dev-only-generation-gate]], [[concepts/ttb-legacy-generation-api]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/capabilities/+server.ts`
