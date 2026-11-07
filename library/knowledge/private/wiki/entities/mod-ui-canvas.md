---
type: entity
title: "ui canvas.ts"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/canvas.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/ui-arcane-shell]]"
  - "[[entities/ui-pitch-trace]]"
  - "[[entities/ui-spectrogram]]"
  - "[[entities/ui-summoning-circle]]"
  - "[[entities/ui-waveform]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[entities/mod-ui-theme]]"
sources:
  - "packages/ui/src/canvas.ts"
---

# ui canvas.ts

## Overview

Shared canvas plumbing (`packages/ui/src/canvas.ts:1`).

## Signature / Definition

```ts
observeCanvas(canvas, draw): () => void; prefersReducedMotion(): boolean; GLOW; type GlowName; arcaneColor(t): [r,g,b]
```

## Behavior

- `observeCanvas` sizes the backing store to device pixel ratio on every ResizeObserver callback and returns a disconnect function (`packages/ui/src/canvas.ts:2-24`).
- `prefersReducedMotion` is SSR-safe (`packages/ui/src/canvas.ts:26-30`).
- `GLOW` palette violet, ember, teal (`packages/ui/src/canvas.ts:32-38`) matches theme tokens (`packages/ui/src/theme.css:20-25`); `arcaneColor` maps 0..1 through void, violet, ember, pale gold (`packages/ui/src/canvas.ts:40-60`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-arcane-shell]], [[entities/ui-pitch-trace]], [[entities/ui-spectrogram]], [[entities/ui-summoning-circle]], [[entities/ui-waveform]]
- **related:** [[entities/mod-ui-theme]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/canvas.ts`
