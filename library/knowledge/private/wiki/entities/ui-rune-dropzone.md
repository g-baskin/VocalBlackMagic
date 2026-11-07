---
type: entity
title: "RuneDropzone.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/RuneDropzone.svelte"
language: svelte
depends_on: []
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
  - "packages/ui/src/RuneDropzone.svelte"
---

# RuneDropzone.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/RuneDropzone.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { label; accept?; multiple?; files (bindable); hint?; max?; disabled?; id? }
```

## Behavior

- Drag-and-drop or picker file intake filtered by `accept` (`packages/ui/src/RuneDropzone.svelte:29-37`); a single-file limit unless `multiple` (`packages/ui/src/RuneDropzone.svelte:24`).
- Rejections are announced in a polite notice (`packages/ui/src/RuneDropzone.svelte:53`, `packages/ui/src/RuneDropzone.svelte:136`). Client filtering only; servers must still validate.
- Imported by 2 app file(s) via `@vbm/ui/RuneDropzone.svelte`; representative: `apps/ttb-studio/src/routes/grimoire/+page.svelte:17`, `apps/vocal-fix/src/routes/+page.svelte:9`.

## Connections

- **depends_on:** none found in source
- **used_by:** 2 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/RuneDropzone.svelte`
