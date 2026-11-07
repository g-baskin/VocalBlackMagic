---
type: entity
title: "OracleStatus.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/OracleStatus.svelte"
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
  - "[[entities/ui-status-panel]]"
sources:
  - "packages/ui/src/OracleStatus.svelte"
---

# OracleStatus.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/OracleStatus.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { tone: 'neutral'|'warning'|'success'|'danger'; children: Snippet }
```

## Behavior

- Status live region (`role=status`, `aria-live=polite`) in four tones (`packages/ui/src/OracleStatus.svelte:7`, `packages/ui/src/OracleStatus.svelte:15`). Successor of [[entities/ui-status-panel]] in app pages.
- Imported by 10 app file(s) via `@vbm/ui/OracleStatus.svelte`; representative: `apps/ttb-studio/src/routes/+page.svelte:11`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:10`, `apps/ttb-studio/src/routes/library/+page.svelte:7`.

## Connections

- **depends_on:** none found in source
- **used_by:** 10 app importer(s), listed in Behavior
- **related:** [[entities/ui-status-panel]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/OracleStatus.svelte`
