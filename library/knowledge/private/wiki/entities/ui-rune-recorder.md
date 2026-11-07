---
type: entity
title: "RuneRecorder.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/RuneRecorder.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-audio]]"
  - "[[entities/ui-rune-button]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
related: []
sources:
  - "packages/ui/src/RuneRecorder.svelte"
---

# RuneRecorder.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/RuneRecorder.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { files (bindable): File[]; maxSeconds?: number = 120; label? }
```

## Behavior

- Records the microphone with getUserMedia and MediaRecorder, with a plain message when unsupported (`packages/ui/src/RuneRecorder.svelte:26-62`).
- Stops automatically at `maxSeconds` (default 120) (`packages/ui/src/RuneRecorder.svelte:7`, `packages/ui/src/RuneRecorder.svelte:112-113`); releases tracks on teardown (`packages/ui/src/RuneRecorder.svelte:34-46`).
- Shows live pitch with `detectPitch` (`packages/ui/src/RuneRecorder.svelte:120-123`).
- Imported by 2 app file(s) via `@vbm/ui/RuneRecorder.svelte`; representative: `apps/ttb-studio/src/routes/grimoire/+page.svelte:19`, `apps/vocal-fix/src/routes/+page.svelte:10`.

## Connections

- **depends_on:** [[entities/mod-ui-audio]], [[entities/ui-rune-button]]
- **used_by:** 2 app importer(s), listed in Behavior
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/RuneRecorder.svelte`
