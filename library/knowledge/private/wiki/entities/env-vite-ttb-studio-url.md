---
type: entity
title: "VITE_TTB_STUDIO_URL"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/+layout.svelte"
language: unknown
depends_on: []
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related: []
sources:
  - "apps/vocal-fix/src/routes/+layout.svelte"
  - "apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte"
---

# VITE_TTB_STUDIO_URL

> [!contradiction]
> Updated in place at HEAD `b58d457`; change introduced in commit `f88cc09`.
> Prior claim: read in `apps/vocal-fix/src/routes/+page.svelte:15`.
> New claim: read in `apps/vocal-fix/src/routes/+layout.svelte:6` and the forge page `apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:16`; `+page.svelte` no longer reads it (grep).

## Overview

Build-time link from Vocal Fix to TTB Studio (`apps/vocal-fix/src/routes/+layout.svelte:6`).

## Signature / Definition

```text
VITE_TTB_STUDIO_URL
```

## Behavior

- Readers: `apps/vocal-fix/src/routes/+layout.svelte:6`; `apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:16`.
- Default: `http://localhost:5174`.
- Validation: none.
- Secrecy: public: inlined into the browser bundle at build time.

## Connections

- **depends_on:** none found in source
- **used_by:** none found in source
- **related:** none found in source

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/+layout.svelte`
- `apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte`

> [!stale]
> The prior version of this page (built at `29c84e4`) said: read in `apps/vocal-fix/src/routes/+page.svelte:15`.
> See the [!contradiction] callout above for the HEAD state.
