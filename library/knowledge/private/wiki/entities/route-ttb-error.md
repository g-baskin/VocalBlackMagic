---
type: entity
title: "TTB Studio ERROR / (error)"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/+error.svelte"
language: ts
depends_on:
  - "[[entities/ui-sigil]]"
  - "[[entities/ui-rune-button]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: ERROR
route_path: "/ (error)"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related: []
sources:
  - "apps/ttb-studio/src/routes/+error.svelte"
---

# TTB Studio ERROR / (error)

## Overview

Error boundary page (`apps/ttb-studio/src/routes/+error.svelte:1-20`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Heading differs for 404; shows `page.error.message` with a fallback (`apps/ttb-studio/src/routes/+error.svelte:7-17`); offers return home or `history.back()` (`apps/ttb-studio/src/routes/+error.svelte:19-20`).

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

- `apps/ttb-studio/src/routes/+error.svelte`
