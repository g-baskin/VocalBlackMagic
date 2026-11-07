---
type: entity
title: "SigilLoader.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/SigilLoader.svelte"
language: svelte
depends_on: []
used_by:
  - "[[entities/ui-grimoire-player]]"
  - "[[entities/ui-ab-compare]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/SigilLoader.svelte"
---

# SigilLoader.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/SigilLoader.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { label?; size?: number = 64 }
```

## Behavior

- Polite status loader, default label `Conjuring…` (`packages/ui/src/SigilLoader.svelte:2-5`).
- Imported by 10 app file(s) via `@vbm/ui/SigilLoader.svelte`; representative: `apps/ttb-studio/src/lib/client/StemMixer.svelte:5`, `apps/ttb-studio/src/routes/+page.svelte:10`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:9`.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-grimoire-player]], [[entities/ui-ab-compare]]; 10 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/SigilLoader.svelte`
