---
type: entity
title: "ArcaneSelect.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/ArcaneSelect.svelte"
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
  - "packages/ui/src/ArcaneSelect.svelte"
---

# ArcaneSelect.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/ArcaneSelect.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { label; value; options: { value; label; hint?; disabled? }[]; id? }
```

## Behavior

- Labelled select whose options may carry hints and be disabled (`packages/ui/src/ArcaneSelect.svelte:8-14`).
- Imported by 5 app file(s) via `@vbm/ui/ArcaneSelect.svelte`; representative: `apps/ttb-studio/src/routes/+page.svelte:7`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:6`, `apps/ttb-studio/src/routes/library/[id]/+page.svelte:12`.

## Connections

- **depends_on:** none found in source
- **used_by:** 5 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/ArcaneSelect.svelte`
