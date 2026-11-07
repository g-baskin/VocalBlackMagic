---
type: entity
title: "TTB Studio PAGE /lyrics"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/lyrics/+page.svelte"
language: ts
depends_on:
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-arcane-input]]"
  - "[[entities/ui-arcane-textarea]]"
  - "[[entities/ui-arcane-select]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/route-ttb-post-studio-lyrics]]"
used_by:
  - "[[entities/route-ttb-layout]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/lyrics"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
  - page
related:
  - "[[concepts/ttb-studio-api-surface]]"
sources:
  - "apps/ttb-studio/src/routes/lyrics/+page.svelte"
---

# TTB Studio PAGE /lyrics

## Overview

Lyric writing desk that can hand its draft to the summon page (`apps/ttb-studio/src/routes/lyrics/+page.svelte:1-68`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Length targets 600, 1500, 3000 chars (`apps/ttb-studio/src/routes/lyrics/+page.svelte:21-29`).
- `run` validates with `validateLyricsRequest` and POSTs `/api/studio/lyrics`, replacing lyrics and possibly title (`apps/ttb-studio/src/routes/lyrics/+page.svelte:32-59`).
- `sendToStudio` stores `{title, lyrics, prompt}` under `sessionStorage` key `vbm-studio-prefill` and navigates to `/` (`apps/ttb-studio/src/routes/lyrics/+page.svelte:61-67`), which the summon page consumes once (`apps/ttb-studio/src/routes/+page.svelte:213-225`).

## Connections

- **depends_on:** [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-arcane-input]], [[entities/ui-arcane-textarea]], [[entities/ui-arcane-select]], [[entities/ui-oracle-status]], [[entities/ui-sigil-loader]], [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/route-ttb-post-studio-lyrics]]
- **used_by:** [[entities/route-ttb-layout]]
- **related:** [[concepts/ttb-studio-api-surface]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/lyrics/+page.svelte`
