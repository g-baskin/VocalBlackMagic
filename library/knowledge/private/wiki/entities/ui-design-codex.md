---
type: entity
title: "DesignCodex.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/DesignCodex.svelte"
language: svelte
depends_on:
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-mermaid-diagram]]"
  - "[[entities/mod-ui-mermaid-doc]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[concepts/ui-arcane-design-system]]"
sources:
  - "packages/ui/src/DesignCodex.svelte"
---

# DesignCodex.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/DesignCodex.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { markdown: string; title?; eyebrow?; lede? }
```

## Behavior

- Extracts every mermaid block from a markdown document and renders each with its heading (`packages/ui/src/DesignCodex.svelte:19`, `packages/ui/src/DesignCodex.svelte:61`); builds a diagram index nav (`packages/ui/src/DesignCodex.svelte:37`).
- Both apps mount it on an `/arcana` page with the design doc (`apps/ttb-studio/src/routes/arcana/+page.svelte:9`, `apps/vocal-fix/src/routes/arcana/+page.svelte:9`).
- Imported by 2 app file(s) via `@vbm/ui/DesignCodex.svelte`; representative: `apps/ttb-studio/src/routes/arcana/+page.svelte:2`, `apps/vocal-fix/src/routes/arcana/+page.svelte:2`.

## Connections

- **depends_on:** [[entities/ui-arcane-panel]], [[entities/ui-mermaid-diagram]], [[entities/mod-ui-mermaid-doc]]
- **used_by:** 2 app importer(s), listed in Behavior
- **related:** [[concepts/ui-arcane-design-system]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/DesignCodex.svelte`
