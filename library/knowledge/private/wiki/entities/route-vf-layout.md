---
type: entity
title: "Vocal Fix root layout"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/+layout.svelte"
language: svelte
depends_on:
  - "[[entities/ui-arcane-shell]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related: []
sources:
  - "apps/vocal-fix/src/routes/+layout.svelte"
---

# Vocal Fix root layout

## Overview

Shell around every Vocal Fix page (`apps/vocal-fix/src/routes/+layout.svelte:1-44`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Imports the shared theme and wraps pages in `ArcaneShell` with links to `/`, `/voices` and `/arcana` (`apps/vocal-fix/src/routes/+layout.svelte:2-4`, `apps/vocal-fix/src/routes/+layout.svelte:18-20`).

## Connections

- **depends_on:** [[entities/ui-arcane-shell]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/+layout.svelte`
