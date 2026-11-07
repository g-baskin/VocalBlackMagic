---
type: entity
title: "MermaidDiagram.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/MermaidDiagram.svelte"
language: svelte
depends_on:
  - "[[entities/ui-sigil]]"
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
  - "packages/ui/src/MermaidDiagram.svelte"
---

# MermaidDiagram.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/MermaidDiagram.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { source: string; label?: string }
```

## Behavior

- Lazy-imports mermaid and initialises it with `securityLevel: strict` and a dark arcane theme (`packages/ui/src/MermaidDiagram.svelte:30-51`).
- All instances share one render queue because mermaid cannot render several at once (`packages/ui/src/MermaidDiagram.svelte:22-23`).
- Writes the rendered SVG through `innerHTML` (`packages/ui/src/MermaidDiagram.svelte:103-108`); input is repo-authored design docs, sanitised by strict mode.
- Renders a polite loading veil and an alert on failure (`packages/ui/src/MermaidDiagram.svelte:131-136`). Not imported directly by apps.

## Connections

- **depends_on:** [[entities/ui-sigil]]
- **used_by:** [[entities/ui-design-codex]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/MermaidDiagram.svelte`
