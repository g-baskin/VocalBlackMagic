---
type: entity
title: "TTB Studio PAGE /grimoire"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/grimoire/+page.svelte"
language: ts
depends_on:
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-arcane-input]]"
  - "[[entities/ui-arcane-textarea]]"
  - "[[entities/ui-arcane-select]]"
  - "[[entities/ui-rune-toggle]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-rune-meter]]"
  - "[[entities/ui-waveform]]"
  - "[[entities/ui-spectrogram]]"
  - "[[entities/ui-pitch-trace]]"
  - "[[entities/ui-summoning-circle]]"
  - "[[entities/ui-grimoire-player]]"
  - "[[entities/ui-rune-dropzone]]"
  - "[[entities/ui-ab-compare]]"
  - "[[entities/ui-rune-recorder]]"
  - "[[entities/ui-voice-sigil]]"
  - "[[entities/mod-ui-audio]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/grimoire"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
  - page
related: []
sources:
  - "apps/ttb-studio/src/routes/grimoire/+page.svelte"
---

# TTB Studio PAGE /grimoire

## Overview

Component showcase for the shared `@vbm/ui` set (`apps/ttb-studio/src/routes/grimoire/+page.svelte:2-21`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- `?demo=1` loads a generated tone on mount (`apps/ttb-studio/src/routes/grimoire/+page.svelte:143-145`); `fakeBusy` cycles progress stages without any request (`apps/ttb-studio/src/routes/grimoire/+page.svelte:147-153`).
- Not in the layout nav (`apps/ttb-studio/src/routes/+layout.svelte:19-23`); reachable only by URL.

## Connections

- **depends_on:** [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-arcane-input]], [[entities/ui-arcane-textarea]], [[entities/ui-arcane-select]], [[entities/ui-rune-toggle]], [[entities/ui-ritual-progress]], [[entities/ui-sigil-loader]], [[entities/ui-oracle-status]], [[entities/ui-rune-meter]], [[entities/ui-waveform]], [[entities/ui-spectrogram]], [[entities/ui-pitch-trace]], [[entities/ui-summoning-circle]], [[entities/ui-grimoire-player]], [[entities/ui-rune-dropzone]], [[entities/ui-ab-compare]], [[entities/ui-rune-recorder]], [[entities/ui-voice-sigil]], [[entities/mod-ui-audio]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/grimoire/+page.svelte`
