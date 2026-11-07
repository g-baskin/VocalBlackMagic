---
type: entity
title: "TTB Studio PAGE /library/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/library/[id]/+page.svelte"
language: ts
depends_on:
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-spectrogram]]"
  - "[[entities/ui-pitch-trace]]"
  - "[[entities/ui-arcane-select]]"
  - "[[entities/ui-arcane-textarea]]"
  - "[[entities/ui-region-select]]"
  - "[[entities/ui-arcane-input]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/mod-ttb-client-jobs]]"
  - "[[entities/ui-ttb-ab-player]]"
  - "[[entities/ui-ttb-stem-mixer]]"
  - "[[entities/env-vite-vocal-fix-url]]"
  - "[[entities/route-ttb-get-studio-songs-id]]"
  - "[[entities/route-ttb-get-studio-songs-id-edit]]"
  - "[[entities/route-ttb-get-studio-voices]]"
  - "[[entities/route-ttb-post-studio-songs-id-edit]]"
  - "[[entities/route-ttb-post-studio-songs-id-stems]]"
  - "[[entities/route-ttb-post-studio-songs-id-reimagine]]"
  - "[[entities/route-ttb-post-studio-songs-id-voice]]"
  - "[[entities/route-ttb-post-studio-songs-id-master]]"
  - "[[entities/route-ttb-post-studio-songs-id-cover]]"
  - "[[entities/route-ttb-get-studio-songs-id-audio]]"
  - "[[entities/route-ttb-get-studio-songs-id-cover]]"
used_by:
  - "[[entities/route-ttb-page-library]]"
  - "[[entities/ui-ttb-song-take]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: PAGE
route_path: "/library/[id]"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
  - page
related:
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/ttb-studio-api-surface]]"
sources:
  - "apps/ttb-studio/src/routes/library/[id]/+page.svelte"
---

# TTB Studio PAGE /library/[id]

## Overview

Song detail page: playback, lineage and every derive ritual (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:1-200`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- `load` fetches `{song, children}` and the parent song (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:53-72`); an effect resets state per id and loads edits and voices, ignoring stale replies (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:74-98`).
- `startRitual` POSTs to `'/api/studio/songs/' + song.id + '/' + path`, so the exact route is chosen at runtime (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:113`). Literal `path` values at call sites: `edit` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:183-200`), `stems` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:374`), `reimagine` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:412`), `voice` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:435`). It then follows the job with `followJob` and reloads (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:118-125`).
- Edit bodies: extend `before_seconds`/`after_seconds` with a 0 < total <= 240 s client check, repaint by selected region, restyle as `action: cover` with strength clamped to 0..1 (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:175-200`).
- `master` and `reconjure` POST literal URLs (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:131-170`).
- `AbPlayer` gets A = this song, B = the parent only for a `master` song, plus a `?download=1` link (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:222-230`); `StemMixer` renders stems (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:245`).
- Links to the Vocal Fix Voice Forge via `VITE_VOCAL_FIX_URL` (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:24`, `apps/ttb-studio/src/routes/library/[id]/+page.svelte:426`).

## Connections

- **depends_on:** [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-sigil-loader]], [[entities/ui-oracle-status]], [[entities/ui-ritual-progress]], [[entities/ui-spectrogram]], [[entities/ui-pitch-trace]], [[entities/ui-arcane-select]], [[entities/ui-arcane-textarea]], [[entities/ui-region-select]], [[entities/ui-arcane-input]], [[entities/mod-ui-audio]], [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/mod-ttb-client-jobs]], [[entities/ui-ttb-ab-player]], [[entities/ui-ttb-stem-mixer]], [[entities/env-vite-vocal-fix-url]], [[entities/route-ttb-get-studio-songs-id]], [[entities/route-ttb-get-studio-songs-id-edit]], [[entities/route-ttb-get-studio-voices]], [[entities/route-ttb-post-studio-songs-id-edit]], [[entities/route-ttb-post-studio-songs-id-stems]], [[entities/route-ttb-post-studio-songs-id-reimagine]], [[entities/route-ttb-post-studio-songs-id-voice]], [[entities/route-ttb-post-studio-songs-id-master]], [[entities/route-ttb-post-studio-songs-id-cover]], [[entities/route-ttb-get-studio-songs-id-audio]], [[entities/route-ttb-get-studio-songs-id-cover]]
- **used_by:** [[entities/route-ttb-page-library]], [[entities/ui-ttb-song-take]]
- **related:** [[concepts/ttb-job-polling]], [[concepts/ttb-studio-api-surface]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/library/[id]/+page.svelte`
