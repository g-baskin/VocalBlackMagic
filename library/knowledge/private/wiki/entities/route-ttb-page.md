---
type: entity
title: "TTB Studio page /"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/+page.svelte"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
  - "[[entities/ui-brand-header]]"
  - "[[entities/ui-status-panel]]"
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
  - "[[entities/env-vite-vocal-fix-url]]"
used_by: []
last_commit_hash: "29c84e4"
tested_by: []
route_method: PAGE
route_path: "/"
tags:
  - entity
  - function
  - ttb-studio
  - page
  - sveltekit-route
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[concepts/premium-studio]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/+page.svelte"
---

# TTB Studio page /

## Overview

Music-request editor for TTB Studio (`apps/ttb-studio/src/routes/+page.svelte:1-398`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- On mount fetches `/api/capabilities` and shows readiness (`apps/ttb-studio/src/routes/+page.svelte:44-60`).
- `generate` validates client-side with `validateGenerationRequest`, POSTs JSON to `/api/generations` and shows inline audio for completed Lyria jobs (`apps/ttb-studio/src/routes/+page.svelte:172-231`); queued jobs are polled every 3 s with exponential back-off for up to 15 minutes (`apps/ttb-studio/src/routes/+page.svelte:130-170`).
- Completed fal jobs load audio from `audio_url` (`apps/ttb-studio/src/routes/+page.svelte:109-128`); failed submits that carry written lyrics put them back in the lyrics box (`apps/ttb-studio/src/routes/+page.svelte:214-224`).
- The Vocal Fix link uses `VITE_VOCAL_FIX_URL` (`apps/ttb-studio/src/routes/+page.svelte:20`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/ui-brand-header]], [[entities/ui-status-panel]], [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/env-vite-vocal-fix-url]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/hosted-generation-flow]], [[concepts/premium-studio]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `88c699c` ("Build responsive SvelteKit 3 Vocal Fix and TTB Studio interfaces with CI") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/+page.svelte`
