---
type: entity
title: "VITE_VOCAL_FIX_URL"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/+layout.svelte"
language: unknown
depends_on: []
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related: []
sources:
  - "apps/ttb-studio/src/routes/+layout.svelte"
  - "apps/ttb-studio/src/routes/library/[id]/+page.svelte"
---

# VITE_VOCAL_FIX_URL

> [!contradiction]
> Updated in place at HEAD `b58d457`; change introduced in commit `f88cc09`.
> Prior claim: read in `apps/ttb-studio/src/routes/+page.svelte:20`.
> New claim: read in `apps/ttb-studio/src/routes/+layout.svelte:7` and `apps/ttb-studio/src/routes/library/[id]/+page.svelte:24`; `+page.svelte` no longer reads it (grep).

## Overview

Build-time link from TTB Studio to Vocal Fix (`apps/ttb-studio/src/routes/+layout.svelte:7`).

## Signature / Definition

```text
VITE_VOCAL_FIX_URL
```

## Behavior

- Readers: `apps/ttb-studio/src/routes/+layout.svelte:7`; `apps/ttb-studio/src/routes/library/[id]/+page.svelte:24`.
- Default: `http://localhost:5173`.
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
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/+layout.svelte`
- `apps/ttb-studio/src/routes/library/[id]/+page.svelte`

> [!stale]
> The prior version of this page (built at `29c84e4`) said: read in `apps/ttb-studio/src/routes/+page.svelte:20`.
> See the [!contradiction] callout above for the HEAD state.
