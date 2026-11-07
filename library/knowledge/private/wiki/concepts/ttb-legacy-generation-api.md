---
type: concept
title: "TTB Studio legacy generation API"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "/api/generations"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/generations/+server.ts"
---

# TTB Studio legacy generation API

## Definition

The `/api/generations` and `/api/capabilities` routes from before `f88cc09`; still deployed in source at HEAD with unchanged handlers, but no browser caller.

## How it works

- Handlers last touched `29c84e4` (`apps/ttb-studio/src/routes/api/generations/+server.ts:22-114`).
- The UI moved to `/api/studio/*` (`apps/ttb-studio/src/routes/+page.svelte:227`, `apps/ttb-studio/src/routes/+page.svelte:288-291`).
- They lack the studio localhost check (`apps/ttb-studio/src/lib/server/studio/context.ts:55-56`).

## Why it matters

Unused paid endpoints are attack and maintenance surface; whether to retire them is open in [[questions/ttb-retire-legacy-generations-routes]].

## Examples in this codebase

- [[entities/route-ttb-post-generations]]

## Connections

- **involves entities:** [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/route-ttb-get-capabilities]]
- **related concepts:** [[concepts/hosted-generation-flow]], [[concepts/dev-only-generation-gate]]

## Sources

- `apps/ttb-studio/src/routes/api/generations/+server.ts`
