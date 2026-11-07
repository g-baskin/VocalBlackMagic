---
type: entity
title: "GrimoirePlayer.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/GrimoirePlayer.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-audio]]"
  - "[[entities/ui-summoning-circle]]"
  - "[[entities/ui-waveform]]"
  - "[[entities/ui-sigil-loader]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[concepts/ui-real-audio-visuals]]"
sources:
  - "packages/ui/src/GrimoirePlayer.svelte"
---

# GrimoirePlayer.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/GrimoirePlayer.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { src; title?; subtitle?; downloadName?; onended?: () => void }
```

## Behavior

- Decodes the source and treats the decoded buffer as the authoritative duration (`packages/ui/src/GrimoirePlayer.svelte:27`).
- Play/pause button and a download link (`packages/ui/src/GrimoirePlayer.svelte:116`, `packages/ui/src/GrimoirePlayer.svelte:130`); errors render as alerts (`packages/ui/src/GrimoirePlayer.svelte:114`).
- Imported by 3 app file(s) via `@vbm/ui/GrimoirePlayer.svelte`; representative: `apps/ttb-studio/src/lib/client/SongTake.svelte:3`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:16`, `apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:11`.

## Connections

- **depends_on:** [[entities/mod-ui-audio]], [[entities/ui-summoning-circle]], [[entities/ui-waveform]], [[entities/ui-sigil-loader]]
- **used_by:** 3 app importer(s), listed in Behavior
- **related:** [[concepts/ui-real-audio-visuals]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/GrimoirePlayer.svelte`
