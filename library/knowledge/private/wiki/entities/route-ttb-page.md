---
type: entity
title: "TTB Studio PAGE /"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/+page.svelte"
language: ts
depends_on:
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-arcane-input]]"
  - "[[entities/ui-arcane-textarea]]"
  - "[[entities/ui-arcane-select]]"
  - "[[entities/ui-rune-toggle]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/ui-ttb-song-take]]"
  - "[[entities/ui-ttb-model-picker]]"
  - "[[entities/route-ttb-get-studio-capabilities]]"
  - "[[entities/route-ttb-get-studio-voices]]"
  - "[[entities/route-ttb-get-studio-songs]]"
  - "[[entities/route-ttb-post-studio-songs]]"
  - "[[entities/route-ttb-get-studio-songs-id]]"
  - "[[entities/route-ttb-get-studio-jobs-id]]"
  - "[[entities/route-ttb-delete-studio-jobs-id]]"
used_by:
  - "[[entities/route-ttb-layout]]"
  - "[[entities/route-ttb-page-lyrics]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: PAGE
route_path: "/"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
  - page
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/premium-studio]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/routes/+page.svelte"
---

# TTB Studio PAGE /

> [!contradiction]
> Contract changed between `29c84e4` and `f88cc09` (HEAD `b58d457`).
> Prior contract: page drove `/api/capabilities` and the `/api/generations` family (submit, 3 s back-off poll, fal audio).
> New contract: page drives `/api/studio/*` (capabilities, songs, jobs, voices) with a fixed 4 s poll; the Vocal Fix link moved to the layout (`apps/ttb-studio/src/routes/+layout.svelte:7`).

## Overview

Summon page: the song-creation editor of TTB Studio (`apps/ttb-studio/src/routes/+page.svelte:1-316`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- On mount loads voices and songs, consumes a one-shot `vbm-studio-prefill` from the Lyrics page, then reads `/api/studio/capabilities` (`apps/ttb-studio/src/routes/+page.svelte:206-230`).
- The picker merges routed `models` and legacy `engines` into `PickerItem`s (`apps/ttb-studio/src/routes/+page.svelte:83-130`) rendered by `ModelPicker` (`apps/ttb-studio/src/routes/+page.svelte:432`).
- `buildRequest` builds a `CreateSongRequest`; a routed model is sent as `engine: minimax-music-1.5` plus `model` (`apps/ttb-studio/src/routes/+page.svelte:234-252`).
- `summon` validates with `validateCreateSongRequest`, POSTs `/api/studio/songs`, then `poll` GETs `/api/studio/jobs/<id>` every 4 s and loads each finished song (`apps/ttb-studio/src/routes/+page.svelte:254-301`); `cancel` DELETEs the job (`apps/ttb-studio/src/routes/+page.svelte:303-310`). Results render as `SongTake` (`apps/ttb-studio/src/routes/+page.svelte:488`).
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `b58d457`: `generate` POSTs to `/api/generations`, polls `/api/generations/<id>` with exponential back-off for up to 15 minutes, reads `/api/capabilities`, uses `ui-brand-header`/`ui-status-panel`, and reads `VITE_VOCAL_FIX_URL` (old `apps/ttb-studio/src/routes/+page.svelte:20`, `44-60`, `130-231` at `29c84e4`).

## Connections

- **depends_on:** [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-arcane-input]], [[entities/ui-arcane-textarea]], [[entities/ui-arcane-select]], [[entities/ui-rune-toggle]], [[entities/ui-ritual-progress]], [[entities/ui-sigil-loader]], [[entities/ui-oracle-status]], [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/ui-ttb-song-take]], [[entities/ui-ttb-model-picker]], [[entities/route-ttb-get-studio-capabilities]], [[entities/route-ttb-get-studio-voices]], [[entities/route-ttb-get-studio-songs]], [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-get-studio-songs-id]], [[entities/route-ttb-get-studio-jobs-id]], [[entities/route-ttb-delete-studio-jobs-id]]
- **used_by:** [[entities/route-ttb-layout]], [[entities/route-ttb-page-lyrics]]
- **related:** [[concepts/hosted-generation-flow]], [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]], [[concepts/premium-studio]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `88c699c` ("Build responsive SvelteKit 3 Vocal Fix and TTB Studio interfaces with CI") on 2026-11-05
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/+page.svelte`
