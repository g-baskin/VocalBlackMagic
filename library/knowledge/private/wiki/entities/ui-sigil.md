---
type: entity
title: "Sigil.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/Sigil.svelte"
language: svelte
depends_on: []
used_by:
  - "[[entities/ui-empty-state]]"
  - "[[entities/ui-arcane-shell]]"
  - "[[entities/ui-mermaid-diagram]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/Sigil.svelte"
---

# Sigil.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/Sigil.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { size?; spin?; dim?; class? }
```

## Behavior

- Decorative SVG sigil, purely presentational (`packages/ui/src/Sigil.svelte:2`).
- Imported by 3 app file(s) via `@vbm/ui/Sigil.svelte`; representative: `apps/ttb-studio/src/routes/+error.svelte:4`, `apps/vocal-fix/src/routes/+error.svelte:4`, `apps/vocal-fix/src/routes/voices/+page.svelte:8`.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-empty-state]], [[entities/ui-arcane-shell]], [[entities/ui-mermaid-diagram]]; 3 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/Sigil.svelte`
