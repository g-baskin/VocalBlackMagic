---
type: entity
title: "VoiceSigil.svelte (@vbm/ui)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/VoiceSigil.svelte"
language: svelte
depends_on:
  - "[[entities/mod-ui-audio]]"
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
  - "packages/ui/src/VoiceSigil.svelte"
---

# VoiceSigil.svelte (@vbm/ui)

## Overview

Shared Svelte 5 component exported as `@vbm/ui/VoiceSigil.svelte` (`packages/ui/package.json`).

## Signature / Definition

```ts
props: { buffer: AudioBuffer | null; size?; label? }
```

## Behavior

- Real, deterministic voice print of a buffer (`packages/ui/src/VoiceSigil.svelte:20`): energy envelope ring, pitch-class polygon and a spectral-centroid hexagram (`packages/ui/src/VoiceSigil.svelte:58-113`).
- Exposed as `role=img` with a generated description (`packages/ui/src/VoiceSigil.svelte:132-133`).
- Imported by 3 app file(s) via `@vbm/ui/VoiceSigil.svelte`; representative: `apps/ttb-studio/src/routes/grimoire/+page.svelte:20`, `apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:11`, `apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:12`.

## Connections

- **depends_on:** [[entities/mod-ui-audio]], [[entities/ui-empty-state]]
- **used_by:** 3 app importer(s), listed in Behavior
- **related:** [[concepts/ui-real-audio-visuals]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/VoiceSigil.svelte`
