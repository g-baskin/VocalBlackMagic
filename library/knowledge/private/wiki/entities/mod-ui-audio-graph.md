---
type: entity
title: "ui audio-graph.ts"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/audio-graph.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/ui-summoning-circle]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
  - audio
related: []
sources:
  - "packages/ui/src/audio-graph.ts"
---

# ui audio-graph.ts

## Overview

One AudioContext plus MediaElementSource per media element, since `createMediaElementSource` may run only once (`packages/ui/src/audio-graph.ts:1`).

## Signature / Definition

```ts
export function getMediaGraph(el: HTMLMediaElement): { ctx; analyser } | null
```

## Behavior

- Caches graphs in a WeakMap (`packages/ui/src/audio-graph.ts:7-11`); returns null without an AudioContext (`packages/ui/src/audio-graph.ts:12-15`).
- Analyser fftSize 1024, smoothing 0.78, connected to the destination (`packages/ui/src/audio-graph.ts:18-22`). Not exported in package.json.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-summoning-circle]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/audio-graph.ts`
