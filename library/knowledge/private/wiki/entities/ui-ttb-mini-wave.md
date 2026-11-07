---
type: entity
title: "MiniWave.svelte"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/MiniWave.svelte"
language: svelte
depends_on:
  - "[[entities/ui-waveform]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/mod-ttb-client-api]]"
used_by:
  - "[[entities/route-ttb-page-library]]"
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
  - "apps/ttb-studio/src/lib/client/MiniWave.svelte"
---

# MiniWave.svelte

## Overview

Small library waveform decoded lazily (`apps/ttb-studio/src/lib/client/MiniWave.svelte:6-30`).

## Signature / Definition

```ts
props: { id: string; label: string }
```

## Behavior

- Decodes `audioUrl(id)` only when the card intersects the viewport, aborting on teardown (`apps/ttb-studio/src/lib/client/MiniWave.svelte:10-27`).

## Connections

- **depends_on:** [[entities/ui-waveform]], [[entities/mod-ui-audio]], [[entities/mod-ttb-client-api]]
- **used_by:** [[entities/route-ttb-page-library]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/MiniWave.svelte`
