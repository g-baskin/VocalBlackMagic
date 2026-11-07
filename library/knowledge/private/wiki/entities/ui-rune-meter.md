---
type: entity
title: "RuneMeter.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/RuneMeter.svelte"
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
  - "packages/ui/src/RuneMeter.svelte"
---

# RuneMeter.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/RuneMeter.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { label; value; display?; tone?: 'good'|'warn'|'bad'; size? }
```

## Behavior

- 270 degree arc meter with `role=meter` (`packages/ui/src/RuneMeter.svelte:18-27`); shows a percentage unless `display` is given (`packages/ui/src/RuneMeter.svelte:21`).
- Imported by 2 app file(s) via `@vbm/ui/RuneMeter.svelte`; representative: `apps/ttb-studio/src/routes/grimoire/+page.svelte:11`, `apps/vocal-fix/src/routes/session/[id]/+page.svelte:11`.

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

- `packages/ui/src/RuneMeter.svelte`
