---
type: entity
title: "EmptyState.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/EmptyState.svelte"
language: svelte
depends_on:
  - "[[entities/ui-sigil]]"
used_by:
  - "[[entities/ui-pitch-trace]]"
  - "[[entities/ui-spectrogram]]"
  - "[[entities/ui-voice-sigil]]"
  - "[[entities/ui-waveform]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/EmptyState.svelte"
---

# EmptyState.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/EmptyState.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { message?: string = 'awaiting sound' }
```

## Behavior

- Placeholder with a dim sigil and message, default `awaiting sound` (`packages/ui/src/EmptyState.svelte:2-3`).
- Not exported in `packages/ui/package.json`; used internally only.

## Connections

- **depends_on:** [[entities/ui-sigil]]
- **used_by:** [[entities/ui-pitch-trace]], [[entities/ui-spectrogram]], [[entities/ui-voice-sigil]], [[entities/ui-waveform]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/EmptyState.svelte`
