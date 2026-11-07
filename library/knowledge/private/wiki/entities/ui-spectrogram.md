---
type: entity
title: "Spectrogram.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/Spectrogram.svelte"
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
  - "packages/ui/src/Spectrogram.svelte"
---

# Spectrogram.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/Spectrogram.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { buffer: AudioBuffer | null; height?: number = 200 }
```

## Behavior

- Computes the STFT once per buffer into an offscreen time by log-frequency image (`packages/ui/src/Spectrogram.svelte:13-41`) coloured with `arcaneColor`; `role=img` (`packages/ui/src/Spectrogram.svelte:80`).
- Imported by 4 app file(s) via `@vbm/ui/Spectrogram.svelte`; representative: `apps/ttb-studio/src/lib/client/SongTake.svelte:4`, `apps/ttb-studio/src/routes/grimoire/+page.svelte:13`, `apps/ttb-studio/src/routes/library/[id]/+page.svelte:10`.

## Connections

- **depends_on:** [[entities/mod-ui-audio]], [[entities/mod-ui-canvas]], [[entities/ui-empty-state]]
- **used_by:** 4 app importer(s), listed in Behavior
- **related:** [[concepts/ui-real-audio-visuals]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/Spectrogram.svelte`
