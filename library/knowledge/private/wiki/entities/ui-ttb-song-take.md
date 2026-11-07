---
type: entity
title: "SongTake.svelte"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/SongTake.svelte"
language: svelte
depends_on:
  - "[[entities/ui-grimoire-player]]"
  - "[[entities/ui-spectrogram]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/route-ttb-page-library-id]]"
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - client
  - svelte-component
related: []
sources:
  - "apps/ttb-studio/src/lib/client/SongTake.svelte"
---

# SongTake.svelte

## Overview

Result card for one generated song (`apps/ttb-studio/src/lib/client/SongTake.svelte:9-38`).

## Signature / Definition

```ts
props: { song: SongMeta }
```

## Behavior

- Decodes and plays `audioUrl(song.id)` (`apps/ttb-studio/src/lib/client/SongTake.svelte:17`, `apps/ttb-studio/src/lib/client/SongTake.svelte:28`) and links to the song page (`apps/ttb-studio/src/lib/client/SongTake.svelte:38`).
- Used at `apps/ttb-studio/src/routes/+page.svelte:488`.

## Connections

- **depends_on:** [[entities/ui-grimoire-player]], [[entities/ui-spectrogram]], [[entities/mod-ui-audio]], [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/route-ttb-page-library-id]]
- **used_by:** [[entities/route-ttb-page]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/SongTake.svelte`
