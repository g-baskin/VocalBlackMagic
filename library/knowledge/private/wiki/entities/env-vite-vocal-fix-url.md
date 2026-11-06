---
type: entity
title: "VITE_VOCAL_FIX_URL"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/+page.svelte"
language: unknown
depends_on: []
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - env-var
  - config
related:
  - "[[entities/ui-brand-header]]"
sources:
  - "apps/ttb-studio/src/routes/+page.svelte"
---

# VITE_VOCAL_FIX_URL

## Overview

Build-time link from TTB Studio to Vocal Fix (`apps/ttb-studio/src/routes/+page.svelte:20`).

## Signature / Definition

```text
VITE_VOCAL_FIX_URL
```

## Behavior

- Falls back to `http://localhost:5173` and is passed to the brand header (`apps/ttb-studio/src/routes/+page.svelte:20`, `apps/ttb-studio/src/routes/+page.svelte:247`). As an `import.meta.env` value it is fixed at build time.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-ttb-page]]
- **related:** [[entities/ui-brand-header]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `88c699c` ("Build responsive SvelteKit 3 Vocal Fix and TTB Studio interfaces with CI") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/routes/+page.svelte`
