---
type: entity
title: "PitchTrace.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/PitchTrace.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-audio]]"
  - "[[entities/mod-ui-canvas]]"
  - "[[entities/ui-empty-state]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[concepts/ui-real-audio-visuals]]"
sources:
  - "packages/ui/src/PitchTrace.svelte"
---

# PitchTrace.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/PitchTrace.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { buffer: AudioBuffer | null; height?: number = 200 }
```

## Behavior

- Runs YIN pitch detection on the real buffer, halving high sample rates first (`packages/ui/src/PitchTrace.svelte:14-17`); unvoiced frames leave gaps (`packages/ui/src/PitchTrace.svelte:72`).
- Draws note-name gridlines (`packages/ui/src/PitchTrace.svelte:58`); exposed as `role=img` (`packages/ui/src/PitchTrace.svelte:89`).
- Imported by 3 app file(s) via `@vbm/ui/PitchTrace.svelte`; representative: `apps/ttb-studio/src/routes/grimoire/+page.svelte:14`, `apps/ttb-studio/src/routes/library/[id]/+page.svelte:11`, `apps/vocal-fix/src/routes/session/[id]/+page.svelte:8`.

## Connections

- **depends_on:** [[entities/mod-ui-audio]], [[entities/mod-ui-canvas]], [[entities/ui-empty-state]]
- **used_by:** 3 app importer(s), listed in Behavior
- **related:** [[concepts/ui-real-audio-visuals]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/PitchTrace.svelte`
