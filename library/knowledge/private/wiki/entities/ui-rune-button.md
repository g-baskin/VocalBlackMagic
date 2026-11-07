---
type: entity
title: "RuneButton.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/RuneButton.svelte"
language: svelte
depends_on: []
used_by:
  - "[[entities/ui-rune-recorder]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/RuneButton.svelte"
---

# RuneButton.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/RuneButton.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { variant?: 'summon'|'ghost'|'danger'; type?: 'button'|'submit'; disabled?; busy?; href?; onclick?; children }
```

## Behavior

- Renders an anchor when `href` is set and not inert, else a button (`packages/ui/src/RuneButton.svelte:25-30`).
- `busy` disables the button and sets `aria-busy` (`packages/ui/src/RuneButton.svelte:22`, `packages/ui/src/RuneButton.svelte:30`).
- Imported by 15 app file(s) via `@vbm/ui/RuneButton.svelte`; representative: `apps/ttb-studio/src/lib/client/AbPlayer.svelte:2`, `apps/ttb-studio/src/lib/client/StemMixer.svelte:3`, `apps/ttb-studio/src/routes/+error.svelte:5`.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-rune-recorder]]; 15 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/RuneButton.svelte`
