---
type: entity
title: "SummoningCircle.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/SummoningCircle.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-audio-graph]]"
  - "[[entities/mod-ui-canvas]]"
used_by:
  - "[[entities/ui-grimoire-player]]"
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
  - "packages/ui/src/SummoningCircle.svelte"
---

# SummoningCircle.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/SummoningCircle.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { audio: HTMLAudioElement | null; size?: number = 220 }
```

## Behavior

- Live radial spectrum of a playing audio element through a shared analyser (`packages/ui/src/SummoningCircle.svelte:2`, `packages/ui/src/SummoningCircle.svelte:59-75`).
- Stops rotating with reduced motion (`packages/ui/src/SummoningCircle.svelte:20`, `packages/ui/src/SummoningCircle.svelte:88`); cross-origin media without CORS disables the graph (`packages/ui/src/SummoningCircle.svelte:97`).
- Imported by 2 app file(s) via `@vbm/ui/SummoningCircle.svelte`; representative: `apps/ttb-studio/src/lib/client/AbPlayer.svelte:4`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:15`.

## Connections

- **depends_on:** [[entities/mod-ui-audio-graph]], [[entities/mod-ui-canvas]]
- **used_by:** [[entities/ui-grimoire-player]]; 2 app importer(s), listed in Behavior
- **related:** [[concepts/ui-real-audio-visuals]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/SummoningCircle.svelte`
