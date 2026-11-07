---
type: entity
title: "ArcaneInput.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/ArcaneInput.svelte"
language: svelte
depends_on: []
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/ArcaneInput.svelte"
---

# ArcaneInput.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/ArcaneInput.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { label; value (bindable); placeholder?; type?: 'text'|'email'|'password'|'search'|'url'|'tel'|'number'; maxlength?; id? }  // ArcaneInput.svelte:10-16
```

## Behavior

- Labelled text input with an id from `$props.id()` (`packages/ui/src/ArcaneInput.svelte:18`).
- Imported by 7 app file(s) via `@vbm/ui/ArcaneInput.svelte`; representative: `apps/ttb-studio/src/routes/+page.svelte:5`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:4`, `apps/ttb-studio/src/routes/library/[id]/+page.svelte:15`.

## Connections

- **depends_on:** none found in source
- **used_by:** 7 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/ArcaneInput.svelte`
