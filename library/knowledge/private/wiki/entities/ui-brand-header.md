---
type: entity
title: "BrandHeader.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/BrandHeader.svelte"
language: ts
depends_on: []
used_by:
  - "[[entities/route-ttb-page]]"
  - "[[entities/route-vf-page]]"
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[entities/env-vite-vocal-fix-url]]"
  - "[[entities/env-vite-ttb-studio-url]]"
sources:
  - "packages/ui/src/BrandHeader.svelte"
---

# BrandHeader.svelte (@vbm/ui)

## Overview

Shared header component showing the product name and a link to the sister app (`packages/ui/src/BrandHeader.svelte:1-16`).

## Signature / Definition

```ts
props: { product: string; sisterUrl: string; sisterName: string }
```

## Behavior

- Renders `Vocal Black Magic / {product}` and an `Open {sisterName}` link to `sisterUrl` (`packages/ui/src/BrandHeader.svelte:9-16`).
- TTB Studio passes the Vocal Fix URL (`apps/ttb-studio/src/routes/+page.svelte:247`); Vocal Fix passes the TTB Studio URL (`apps/vocal-fix/src/routes/+page.svelte:99`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-ttb-page]], [[entities/route-vf-page]]
- **related:** [[entities/env-vite-vocal-fix-url]], [[entities/env-vite-ttb-studio-url]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `packages/ui/src/BrandHeader.svelte`
