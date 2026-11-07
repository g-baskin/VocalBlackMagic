---
type: entity
title: "Vocal Fix page /session/[id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/session/[id]/+page.svelte"
language: svelte
depends_on:
  - "[[entities/mod-vf-client]]"
  - "[[entities/route-vf-get-sessions-id]]"
  - "[[entities/route-vf-get-capabilities]]"
  - "[[entities/route-vf-post-sessions-id-diagnose]]"
  - "[[entities/route-vf-post-sessions-id-repair]]"
  - "[[entities/route-vf-get-sessions-id-jobs-job]]"
  - "[[entities/route-vf-delete-sessions-id-jobs-job]]"
  - "[[entities/route-vf-delete-sessions-id]]"
  - "[[entities/route-vf-get-sessions-id-audio-area-file]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/ui-ab-compare]]"
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-arcane-select]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-pitch-trace]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-rune-meter]]"
  - "[[entities/ui-rune-toggle]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-spectrogram]]"
  - "[[entities/ui-waveform]]"
used_by:
  - "[[entities/route-vf-page]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/session/[id]"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/routes/session/[id]/+page.svelte"
---

# Vocal Fix page /session/[id]

## Overview

Diagnosis, repair and A/B comparison for one session (`apps/vocal-fix/src/routes/session/[id]/+page.svelte:1-446`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Loads the session and capabilities (`apps/vocal-fix/src/routes/session/[id]/+page.svelte:63-79`); re-diagnoses on request (`apps/vocal-fix/src/routes/session/[id]/+page.svelte:98-107`).
- `startRepair` posts preset, isolate, enhance and optional take ids, then polls the job every 1.5 s (`apps/vocal-fix/src/routes/session/[id]/+page.svelte:109-125`); `cancel` sends DELETE on the job (`apps/vocal-fix/src/routes/session/[id]/+page.svelte:127-132`).
- `destroy` confirms, then deletes the session (`apps/vocal-fix/src/routes/session/[id]/+page.svelte:134-144`).
- Forge sessions link to the gold board once all takes are repaired, and to the forge once gold exists (`apps/vocal-fix/src/routes/session/[id]/+page.svelte:176-184`).

## Connections

- **depends_on:** [[entities/mod-vf-client]], [[entities/route-vf-get-sessions-id]], [[entities/route-vf-get-capabilities]], [[entities/route-vf-post-sessions-id-diagnose]], [[entities/route-vf-post-sessions-id-repair]], [[entities/route-vf-get-sessions-id-jobs-job]], [[entities/route-vf-delete-sessions-id-jobs-job]], [[entities/route-vf-delete-sessions-id]], [[entities/route-vf-get-sessions-id-audio-area-file]], [[entities/mod-ui-audio]], [[entities/ui-ab-compare]], [[entities/ui-arcane-panel]], [[entities/ui-arcane-select]], [[entities/ui-oracle-status]], [[entities/ui-pitch-trace]], [[entities/ui-ritual-progress]], [[entities/ui-rune-button]], [[entities/ui-rune-meter]], [[entities/ui-rune-toggle]], [[entities/ui-sigil-loader]], [[entities/ui-spectrogram]], [[entities/ui-waveform]]
- **used_by:** [[entities/route-vf-page]]
- **related:** [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/session/[id]/+page.svelte`
