---
type: entity
title: "BrandHeader.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/BrandHeader.svelte"
language: svelte
depends_on: []
used_by: []
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[entities/ui-arcane-shell]]"
  - "[[entities/env-vite-vocal-fix-url]]"
  - "[[entities/env-vite-ttb-studio-url]]"
  - "[[questions/ui-unused-legacy-components]]"
sources:
  - "packages/ui/src/BrandHeader.svelte"
---

# BrandHeader.svelte (@vbm/ui)

> [!contradiction]
> Updated in place at HEAD `b58d457` (wiki previously built at `29c84e4`).
> Prior contract: used_by [[entities/route-ttb-page]] (`apps/ttb-studio/src/routes/+page.svelte:247`) and [[entities/route-vf-page]] (`apps/vocal-fix/src/routes/+page.svelte:99`).
> New contract: no importer; sister-app navigation moved to ArcaneShell (`packages/ui/src/ArcaneShell.svelte:95-97`).

## Overview

Legacy shared header showing the product name and a sister-app link (`packages/ui/src/BrandHeader.svelte:1-16`). Still exported (`packages/ui/package.json`), but no app imports it at HEAD.

## Signature / Definition

```ts
props: { product: string; sisterUrl: string; sisterName: string }
```

## Behavior

- Renders `Vocal Black Magic / {product}` and an `Open {sisterName}` link to `sisterUrl` (`packages/ui/src/BrandHeader.svelte:9-16`).
- No import in `apps/*/src` (grep); only stale build output under `apps/vocal-fix/build` and `.svelte-kit` references it. Both layouts use [[entities/ui-arcane-shell]] instead.

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** [[entities/ui-arcane-shell]], [[entities/env-vite-vocal-fix-url]], [[entities/env-vite-ttb-studio-url]], [[questions/ui-unused-legacy-components]]

## Tested by

- No test found in the repository for this entity.

## Prior claims

> [!stale]
> Superseded at HEAD `b58d457` (change landed in commit `f88cc09`, 2026-11-06); see the [!contradiction] callout above.
> Prior claim (wiki built at `29c84e4`): TTB Studio passes the Vocal Fix URL (`apps/ttb-studio/src/routes/+page.svelte:247`); Vocal Fix passes the TTB Studio URL (`apps/vocal-fix/src/routes/+page.svelte:99`).

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `packages/ui/src/BrandHeader.svelte`
