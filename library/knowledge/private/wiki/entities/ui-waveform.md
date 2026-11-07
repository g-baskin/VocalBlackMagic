---
type: entity
title: "Waveform.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/Waveform.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-audio]]"
  - "[[entities/mod-ui-canvas]]"
  - "[[entities/ui-empty-state]]"
used_by:
  - "[[entities/ui-grimoire-player]]"
  - "[[entities/ui-ab-compare]]"
  - "[[entities/ui-region-select]]"
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
  - "packages/ui/src/Waveform.svelte"
---

# Waveform.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/Waveform.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { buffer; currentTime?; duration?; onseek?; height?; color?: GlowName; compareBuffer?; regions?; label? }
```

## Behavior

- Draws min/max peaks of the real buffer, optionally overlaying a compare buffer and labelled regions (`packages/ui/src/Waveform.svelte:17-61`).
- Seekable `role=slider` with arrow, Home and End keys (`packages/ui/src/Waveform.svelte:131-134`, `packages/ui/src/Waveform.svelte:145`).
- Imported by 7 app file(s) via `@vbm/ui/Waveform.svelte`; representative: `apps/ttb-studio/src/lib/client/AbPlayer.svelte:3`, `apps/ttb-studio/src/lib/client/MiniWave.svelte:2`, `apps/ttb-studio/src/lib/client/StemMixer.svelte:4`.

## Connections

- **depends_on:** [[entities/mod-ui-audio]], [[entities/mod-ui-canvas]], [[entities/ui-empty-state]]
- **used_by:** [[entities/ui-grimoire-player]], [[entities/ui-ab-compare]], [[entities/ui-region-select]]; 7 app importer(s), listed in Behavior
- **related:** [[concepts/ui-real-audio-visuals]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/Waveform.svelte`
