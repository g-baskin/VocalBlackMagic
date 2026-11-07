---
type: entity
title: "StatusPanel.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/StatusPanel.svelte"
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
  - "[[entities/ui-oracle-status]]"
  - "[[questions/ui-unused-legacy-components]]"
sources:
  - "packages/ui/src/StatusPanel.svelte"
---

# StatusPanel.svelte (@vbm/ui)

> [!contradiction]
> Updated in place at HEAD `b58d457` (wiki previously built at `29c84e4`).
> Prior contract: used_by [[entities/route-ttb-page]] (`apps/ttb-studio/src/routes/+page.svelte:367`) and [[entities/route-vf-page]] (`apps/vocal-fix/src/routes/+page.svelte:159`).
> New contract: no importer at HEAD.

## Overview

Legacy live-region status box (`packages/ui/src/StatusPanel.svelte:1-18`). Still exported, but no app imports it at HEAD.

## Signature / Definition

```ts
props: { title?: string = 'Status'; message: string; tone?: 'neutral' | 'warning' | 'success' = 'neutral' }
```

## Behavior

- Renders `role="status"` with `aria-live="polite"` and tone classes (`packages/ui/src/StatusPanel.svelte:9-18`).
- No import in `apps/*/src` (grep); pages use [[entities/ui-oracle-status]] (10 importers).

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** [[entities/ui-oracle-status]], [[questions/ui-unused-legacy-components]]

## Tested by

- No test found in the repository for this entity.

## Prior claims

> [!stale]
> Superseded at HEAD `b58d457` (change landed in commit `f88cc09`, 2026-11-06); see the [!contradiction] callout above.
> Prior claim (wiki built at `29c84e4`): Used for generation status in TTB Studio (`apps/ttb-studio/src/routes/+page.svelte:367`) and reference status in Vocal Fix (`apps/vocal-fix/src/routes/+page.svelte:159`).

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `packages/ui/src/StatusPanel.svelte`
