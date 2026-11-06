---
type: entity
title: "StatusPanel.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/StatusPanel.svelte"
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
related: []
sources:
  - "packages/ui/src/StatusPanel.svelte"
---

# StatusPanel.svelte (@vbm/ui)

## Overview

Shared live-region status box (`packages/ui/src/StatusPanel.svelte:1-18`).

## Signature / Definition

```ts
props: { title?: string = 'Status'; message: string; tone?: 'neutral' | 'warning' | 'success' = 'neutral' }
```

## Behavior

- Renders `role="status"` with `aria-live="polite"` and tone classes (`packages/ui/src/StatusPanel.svelte:9-18`).
- Used for generation status in TTB Studio (`apps/ttb-studio/src/routes/+page.svelte:367`) and reference status in Vocal Fix (`apps/vocal-fix/src/routes/+page.svelte:159`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-ttb-page]], [[entities/route-vf-page]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `packages/ui/src/StatusPanel.svelte`
