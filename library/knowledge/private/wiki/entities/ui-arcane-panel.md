---
type: entity
title: "ArcanePanel.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/ArcanePanel.svelte"
language: svelte
depends_on: []
used_by:
  - "[[entities/ui-design-codex]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/ArcanePanel.svelte"
---

# ArcanePanel.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/ArcanePanel.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { title?; eyebrow?; glow?: 'violet'|'ember'|'teal'; children: Snippet; actions?: Snippet }
```

## Behavior

- Panel with optional title, eyebrow and actions snippet in one of three glow colours (`packages/ui/src/ArcanePanel.svelte:11-16`).
- Imported by 11 app file(s) via `@vbm/ui/ArcanePanel.svelte`; representative: `apps/ttb-studio/src/routes/+page.svelte:3`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:2`, `apps/ttb-studio/src/routes/library/+page.svelte:4`.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-design-codex]]; 11 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/ArcanePanel.svelte`
