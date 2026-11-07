---
type: entity
title: "ABCompare.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/ABCompare.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-audio]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-waveform]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/ABCompare.svelte"
---

# ABCompare.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/ABCompare.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { a: { src; label }; b: { src; label }; title?: string }  // packages/ui/src/ABCompare.svelte:6-7
```

## Behavior

- Plays both sources in lock-step through Web Audio; switching only swaps gains (`packages/ui/src/ABCompare.svelte:21-22`).
- Keys A and B choose a side (`packages/ui/src/ABCompare.svelte:135-140`); fetch or decode failure shows an alert (`packages/ui/src/ABCompare.svelte:47`, `packages/ui/src/ABCompare.svelte:225`).
- Imported by 2 app file(s) via `@vbm/ui/ABCompare.svelte`; representative: `apps/ttb-studio/src/routes/grimoire/+page.svelte:18`, `apps/vocal-fix/src/routes/session/[id]/+page.svelte:4`.

## Connections

- **depends_on:** [[entities/mod-ui-audio]], [[entities/ui-sigil-loader]], [[entities/ui-waveform]]
- **used_by:** 2 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/ABCompare.svelte`
