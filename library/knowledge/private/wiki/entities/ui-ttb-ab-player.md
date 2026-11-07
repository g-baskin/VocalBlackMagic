---
type: entity
title: "AbPlayer.svelte"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/AbPlayer.svelte"
language: svelte
depends_on:
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-waveform]]"
  - "[[entities/ui-summoning-circle]]"
  - "[[entities/mod-ui-audio]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
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
  - "apps/ttb-studio/src/lib/client/AbPlayer.svelte"
---

# AbPlayer.svelte

## Overview

Single transport that can flip between source A and optional B at the same position (`apps/ttb-studio/src/lib/client/AbPlayer.svelte:7-40`).

## Signature / Definition

```ts
props: { a: string; b?: string | null; labelA?; labelB?; buffer: AudioBuffer | null; downloadHref: string; downloadName: string; cover?: string | null }
```

## Behavior

- `src` is B only when toggled and B exists (`apps/ttb-studio/src/lib/client/AbPlayer.svelte:33`); `toggleSource` keeps time and play state (`apps/ttb-studio/src/lib/client/AbPlayer.svelte:35-40`).
- Download link uses `downloadHref`/`downloadName` (`apps/ttb-studio/src/lib/client/AbPlayer.svelte:90`).

## Connections

- **depends_on:** [[entities/ui-rune-button]], [[entities/ui-waveform]], [[entities/ui-summoning-circle]], [[entities/mod-ui-audio]]
- **used_by:** [[entities/route-ttb-page-library-id]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/AbPlayer.svelte`
