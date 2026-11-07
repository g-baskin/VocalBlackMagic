---
type: entity
title: "Vocal Fix page /session/[id]/forge"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte"
language: svelte
depends_on:
  - "[[entities/route-vf-get-sessions-id]]"
  - "[[entities/route-vf-post-sessions-id-forge]]"
  - "[[entities/route-vf-get-sessions-id-jobs-job]]"
  - "[[entities/route-vf-get-sessions-id-audio-area-file]]"
  - "[[entities/env-vite-ttb-studio-url]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-arcane-input]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-rune-toggle]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-voice-sigil]]"
used_by:
  - "[[entities/route-vf-page-session-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/session/[id]/forge"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-voice-forge]]"
  - "[[concepts/consent-record]]"
sources:
  - "apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte"
---

# Vocal Fix page /session/[id]/forge

## Overview

Own-voice consent and RVC training page (`apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:1-292`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Hard-codes the consent statement, which must equal the server constant (`apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:14-15`).
- Enables signing only when gold exists, the typed name matches the performer and the own-voice box is ticked (`apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:44-48`); the server rechecks this (`apps/vocal-fix/src/lib/server/forge.ts:18-31`).
- `sign` POSTs `attested_name`, `own_voice: true` and the statement, then polls the job every 2.5 s (`apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:77-115`).
- Links to TTB Studio via `VITE_TTB_STUDIO_URL` (`apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte:16`).

## Connections

- **depends_on:** [[entities/route-vf-get-sessions-id]], [[entities/route-vf-post-sessions-id-forge]], [[entities/route-vf-get-sessions-id-jobs-job]], [[entities/route-vf-get-sessions-id-audio-area-file]], [[entities/env-vite-ttb-studio-url]], [[entities/mod-ui-audio]], [[entities/ui-arcane-panel]], [[entities/ui-arcane-input]], [[entities/ui-rune-button]], [[entities/ui-rune-toggle]], [[entities/ui-ritual-progress]], [[entities/ui-oracle-status]], [[entities/ui-sigil-loader]], [[entities/ui-voice-sigil]]
- **used_by:** [[entities/route-vf-page-session-id]]
- **related:** [[concepts/vocal-fix-voice-forge]], [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/session/[id]/forge/+page.svelte`
