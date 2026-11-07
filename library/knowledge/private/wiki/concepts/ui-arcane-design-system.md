---
type: concept
title: "Arcane design system (@vbm/ui)"
complexity: basic
domain: "vocal-black-magic"
aliases:
  - "arcane UI"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/ui-real-audio-visuals]]"
sources:
  - "packages/ui/package.json"
  - "packages/ui/src/theme.css"
---

# Arcane design system (@vbm/ui)

## Definition

The shared Svelte 5 component library both apps import as `@vbm/ui/<Component>.svelte`, with one theme stylesheet. Introduced in commit `f88cc09`.

## How it works

- `packages/ui/package.json` exports 27 Svelte components plus `theme.css`, `audio`, `region` and `mermaid-doc`; `EmptyState.svelte` is internal only.
- Tokens, fonts, focus ring and reduced-motion rules live in `packages/ui/src/theme.css:1-183`; canvas colours mirror them (`packages/ui/src/canvas.ts:32-36`).
- Both apps wrap pages in ArcaneShell (`apps/ttb-studio/src/routes/+layout.svelte:5`, `apps/vocal-fix/src/routes/+layout.svelte:4`) and show the design docs with DesignCodex on `/arcana`.
- Animated parts honour `prefers-reduced-motion` (`packages/ui/src/canvas.ts:26-30`).

## Why it matters

Keeps the two independent apps visually one product without sharing runtime code beyond presentational components.

## Examples in this codebase

- [[entities/ui-arcane-shell]], [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-oracle-status]], [[entities/ui-design-codex]], [[entities/mod-ui-theme]]

## Connections

- **involves entities:** [[entities/mod-ui-theme]], [[entities/mod-ui-canvas]], [[entities/ui-arcane-shell]], [[entities/ui-design-codex]], [[entities/ui-mermaid-diagram]], [[entities/ui-brand-header]], [[entities/ui-status-panel]]
- **related concepts:** [[concepts/ui-real-audio-visuals]]

## Sources

- `packages/ui/package.json`
- `packages/ui/src/theme.css`
