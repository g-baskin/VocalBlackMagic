---
type: entity
title: "TTB Studio LAYOUT / (layout)"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/+layout.svelte"
language: ts
depends_on:
  - "[[entities/ui-arcane-shell]]"
  - "[[entities/env-vite-vocal-fix-url]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
route_method: LAYOUT
route_path: "/ (layout)"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related: []
sources:
  - "apps/ttb-studio/src/routes/+layout.svelte"
---

# TTB Studio LAYOUT / (layout)

## Overview

Root layout wrapping every TTB Studio page in `ArcaneShell` (`apps/ttb-studio/src/routes/+layout.svelte:1-49`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Loads `@vbm/ui/theme.css` and `app.css` (`apps/ttb-studio/src/routes/+layout.svelte:3-4`); `vocalFixUrl` is `VITE_VOCAL_FIX_URL` or `http://localhost:5173` (`apps/ttb-studio/src/routes/+layout.svelte:7`).
- Nav links: Summon `/`, Library, Lyrics, Séance, Arcana (`apps/ttb-studio/src/routes/+layout.svelte:19-23`).

## Connections

- **depends_on:** [[entities/ui-arcane-shell]], [[entities/env-vite-vocal-fix-url]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/+layout.svelte`
