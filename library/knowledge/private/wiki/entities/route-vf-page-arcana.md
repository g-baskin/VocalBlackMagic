---
type: entity
title: "Vocal Fix page /arcana"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/arcana/+page.svelte"
language: svelte
depends_on:
  - "[[entities/ui-design-codex]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/arcana"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related: []
sources:
  - "apps/vocal-fix/src/routes/arcana/+page.svelte"
---

# Vocal Fix page /arcana

## Overview

Design-system reference page (`apps/vocal-fix/src/routes/arcana/+page.svelte:1-18`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Renders `docs/DESIGN.md` imported raw through `DesignCodex` (`apps/vocal-fix/src/routes/arcana/+page.svelte:2-3`, `apps/vocal-fix/src/routes/arcana/+page.svelte:8-10`).

## Connections

- **depends_on:** [[entities/ui-design-codex]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/arcana/+page.svelte`
