---
type: entity
title: "StemMixer.svelte"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/StemMixer.svelte"
language: svelte
depends_on:
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-waveform]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/mod-ttb-client-jobs]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - client
  - svelte-component
related: []
sources:
  - "apps/ttb-studio/src/lib/client/StemMixer.svelte"
---

# StemMixer.svelte

## Overview

Browser-side stem mixer with mute, solo, volume and WAV export (`apps/ttb-studio/src/lib/client/StemMixer.svelte:11-160`).

## Signature / Definition

```ts
props: { song: SongMeta }
```

## Behavior

- Fetches each stem via `audioUrl(song.id, stem.name)` and decodes it in an `AudioContext` (`apps/ttb-studio/src/lib/client/StemMixer.svelte:36-58`); solo overrides mute (`apps/ttb-studio/src/lib/client/StemMixer.svelte:33-34`).
- `exportMix` renders audible stems in an `OfflineAudioContext` and downloads `encodeWav` output; nothing is uploaded (`apps/ttb-studio/src/lib/client/StemMixer.svelte:131-157`).

## Connections

- **depends_on:** [[entities/ui-rune-button]], [[entities/ui-waveform]], [[entities/ui-sigil-loader]], [[entities/mod-ui-audio]], [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/mod-ttb-client-jobs]]
- **used_by:** [[entities/route-ttb-page-library-id]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/StemMixer.svelte`
