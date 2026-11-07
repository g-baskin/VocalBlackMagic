---
type: entity
title: "TTB Studio PAGE /library"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/library/+page.svelte"
language: ts
depends_on:
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/ui-ttb-mini-wave]]"
  - "[[entities/route-ttb-get-studio-songs]]"
  - "[[entities/route-ttb-patch-studio-songs-id]]"
  - "[[entities/route-ttb-delete-studio-songs-id]]"
  - "[[entities/route-ttb-get-studio-songs-id-cover]]"
used_by:
  - "[[entities/route-ttb-layout]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/library"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
  - page
related:
  - "[[concepts/ttb-studio-api-surface]]"
sources:
  - "apps/ttb-studio/src/routes/library/+page.svelte"
---

# TTB Studio PAGE /library

## Overview

Song library list with favourite filter, rename and delete (`apps/ttb-studio/src/routes/library/+page.svelte:1-65`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Loads `/api/studio/songs` on mount (`apps/ttb-studio/src/routes/library/+page.svelte:27-34`); filter `all` or favourites (`apps/ttb-studio/src/routes/library/+page.svelte:25`).
- `patch` sends PATCH with `{title?, favourite?}` (`apps/ttb-studio/src/routes/library/+page.svelte:36-53`); `remove` asks `confirm` then DELETEs (`apps/ttb-studio/src/routes/library/+page.svelte:54-62`).
- Cards show the cover via `coverUrl` (`apps/ttb-studio/src/routes/library/+page.svelte:123`), a lazy `MiniWave` (`apps/ttb-studio/src/routes/library/+page.svelte:145`) and link to `/library/[id]` (`apps/ttb-studio/src/routes/library/+page.svelte:119`).

## Connections

- **depends_on:** [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-sigil-loader]], [[entities/ui-oracle-status]], [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/ui-ttb-mini-wave]], [[entities/route-ttb-get-studio-songs]], [[entities/route-ttb-patch-studio-songs-id]], [[entities/route-ttb-delete-studio-songs-id]], [[entities/route-ttb-get-studio-songs-id-cover]]
- **used_by:** [[entities/route-ttb-layout]]
- **related:** [[concepts/ttb-studio-api-surface]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/library/+page.svelte`
