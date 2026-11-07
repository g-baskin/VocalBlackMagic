---
type: entity
title: "Vocal Fix error page"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/+error.svelte"
language: svelte
depends_on:
  - "[[entities/ui-sigil]]"
  - "[[entities/ui-rune-button]]"
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
  - "apps/vocal-fix/src/routes/+error.svelte"
---

# Vocal Fix error page

## Overview

Error boundary page (`apps/vocal-fix/src/routes/+error.svelte:1-70`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Shows the status, a 404-specific heading and the error message, with return and back buttons (`apps/vocal-fix/src/routes/+error.svelte:6-21`).

## Connections

- **depends_on:** [[entities/ui-sigil]], [[entities/ui-rune-button]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/+error.svelte`
