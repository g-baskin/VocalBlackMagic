---
type: entity
title: "VITE_TTB_STUDIO_URL"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/+page.svelte"
language: unknown
depends_on: []
used_by:
  - "[[entities/route-vf-page]]"
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - entity
  - env-var
  - config
related:
  - "[[entities/ui-brand-header]]"
sources:
  - "apps/vocal-fix/src/routes/+page.svelte"
---

# VITE_TTB_STUDIO_URL

## Overview

Build-time link from Vocal Fix to TTB Studio (`apps/vocal-fix/src/routes/+page.svelte:15`).

## Signature / Definition

```text
VITE_TTB_STUDIO_URL
```

## Behavior

- Falls back to `http://localhost:5174` (`apps/vocal-fix/src/routes/+page.svelte:15`) and feeds the brand header (`apps/vocal-fix/src/routes/+page.svelte:99`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-vf-page]]
- **related:** [[entities/ui-brand-header]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `88c699c` ("Build responsive SvelteKit 3 Vocal Fix and TTB Studio interfaces with CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/routes/+page.svelte`
