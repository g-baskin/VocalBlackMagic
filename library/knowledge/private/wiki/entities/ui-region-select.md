---
type: entity
title: "RegionSelect.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/RegionSelect.svelte"
language: svelte
depends_on:
  - "[[entities/ui-waveform]]"
  - "[[entities/mod-ui-region]]"
used_by: []
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-ui-region]]"
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[entities/contract-validate-edit-request]]"
sources:
  - "packages/ui/src/RegionSelect.svelte"
---

# RegionSelect.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/RegionSelect.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { buffer; start? (bindable); end? (bindable); minLength?; maxLength?; height?; label? }
```

## Behavior

- Selects a time range on the real decoded audio (`packages/ui/src/RegionSelect.svelte:14-15`); starts at 25% with up to 15 s once the buffer is known (`packages/ui/src/RegionSelect.svelte:36-40`).
- Pointer drag plus two keyboard sliders using `nudge` (`packages/ui/src/RegionSelect.svelte:52-76`, `packages/ui/src/RegionSelect.svelte:103-116`).
- Used for repaint selection on the song page (`apps/ttb-studio/src/routes/library/[id]/+page.svelte:14`).
- Imported by 1 app file(s) via `@vbm/ui/RegionSelect.svelte`; representative: `apps/ttb-studio/src/routes/library/[id]/+page.svelte:14`.

## Connections

- **depends_on:** [[entities/ui-waveform]], [[entities/mod-ui-region]]
- **used_by:** 1 app importer(s), listed in Behavior
- **related:** [[entities/contract-validate-edit-request]]

## Tested by

- [[entities/test-ui-region]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/ui/src/RegionSelect.svelte`
