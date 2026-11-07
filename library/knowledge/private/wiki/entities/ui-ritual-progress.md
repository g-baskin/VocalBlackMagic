---
type: entity
title: "RitualProgress.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/RitualProgress.svelte"
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
related:
  - "[[entities/contract-studio-job]]"
sources:
  - "packages/ui/src/RitualProgress.svelte"
---

# RitualProgress.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/RitualProgress.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { stages: { id; label; state: 'pending'|'active'|'done'|'failed' }[]; detail? }
```

## Behavior

- Ordered list of stages with an accessible done count (`packages/ui/src/RitualProgress.svelte:21`) and a polite detail line (`packages/ui/src/RitualProgress.svelte:32`).
- Imported by 8 app file(s) via `@vbm/ui/RitualProgress.svelte`; representative: `apps/ttb-studio/src/routes/+page.svelte:9`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:8`, `apps/ttb-studio/src/routes/library/[id]/+page.svelte:9`.

## Connections

- **depends_on:** none found in source
- **used_by:** 8 app importer(s), listed in Behavior
- **related:** [[entities/contract-studio-job]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/RitualProgress.svelte`
