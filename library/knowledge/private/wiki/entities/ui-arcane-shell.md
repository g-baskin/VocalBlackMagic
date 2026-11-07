---
type: entity
title: "ArcaneShell.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/ArcaneShell.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-canvas]]"
  - "[[entities/ui-sigil]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[entities/ui-brand-header]]"
  - "[[entities/env-vite-vocal-fix-url]]"
  - "[[entities/env-vite-ttb-studio-url]]"
sources:
  - "packages/ui/src/ArcaneShell.svelte"
---

# ArcaneShell.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/ArcaneShell.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { app: 'studio'|'vocal-fix'; studioUrl; vocalFixUrl; children: Snippet }
```

## Behavior

- App chrome for both apps: skip link, brand mark and a nav marking the current app with `aria-current` (`packages/ui/src/ArcaneShell.svelte:85-97`).
- Animated background canvas drawn at half resolution; with reduced motion it draws one static frame (`packages/ui/src/ArcaneShell.svelte:29-37`, `packages/ui/src/ArcaneShell.svelte:59-72`).
- Replaces [[entities/ui-brand-header]] as the sister-app link in both layouts (`apps/ttb-studio/src/routes/+layout.svelte:5`, `apps/vocal-fix/src/routes/+layout.svelte:4`).
- Imported by 2 app file(s) via `@vbm/ui/ArcaneShell.svelte`; representative: `apps/ttb-studio/src/routes/+layout.svelte:5`, `apps/vocal-fix/src/routes/+layout.svelte:4`.

## Connections

- **depends_on:** [[entities/mod-ui-canvas]], [[entities/ui-sigil]]
- **used_by:** 2 app importer(s), listed in Behavior
- **related:** [[entities/ui-brand-header]], [[entities/env-vite-vocal-fix-url]], [[entities/env-vite-ttb-studio-url]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/ArcaneShell.svelte`
