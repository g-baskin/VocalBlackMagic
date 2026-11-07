---
type: entity
title: "TTB Studio PAGE /arcana"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/arcana/+page.svelte"
language: ts
depends_on:
  - "[[entities/ui-design-codex]]"
used_by:
  - "[[entities/route-ttb-layout]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/arcana"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
  - page
related: []
sources:
  - "apps/ttb-studio/src/routes/arcana/+page.svelte"
---

# TTB Studio PAGE /arcana

## Overview

Renders `docs/DESIGN.md` through `DesignCodex` (`apps/ttb-studio/src/routes/arcana/+page.svelte:1-10`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Imports the markdown with `?raw` at build time, so edits to `docs/DESIGN.md` need a rebuild (`apps/ttb-studio/src/routes/arcana/+page.svelte:3`).

## Connections

- **depends_on:** [[entities/ui-design-codex]]
- **used_by:** [[entities/route-ttb-layout]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/arcana/+page.svelte`
