---
type: entity
title: "Vocal Fix page /session/[id]/gold"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte"
language: svelte
depends_on:
  - "[[entities/route-vf-get-sessions-id]]"
  - "[[entities/route-vf-post-sessions-id-gold]]"
  - "[[entities/route-vf-get-sessions-id-audio-area-file]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-rune-toggle]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-waveform]]"
  - "[[entities/ui-grimoire-player]]"
  - "[[entities/ui-voice-sigil]]"
used_by:
  - "[[entities/route-vf-page-session-id]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/session/[id]/gold"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related:
  - "[[concepts/gold-vocal]]"
sources:
  - "apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte"
---

# Vocal Fix page /session/[id]/gold

## Overview

Gold Vocal phrase board (`apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:1-425`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Loads the manifest and seeds phrase choices from the stored gold (`apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:70-86`).
- `reassemble` returns early when no gold exists, else posts included and excluded phrase ids and reloads (`apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:146-148`, `apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:163-180`).
- Error text reads `body.error`, but the server sends `detail`, so users see `HTTP <status>` (`apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:171`, `apps/vocal-fix/src/lib/server/errors.ts:13`).
- No caller found that creates the first Gold Vocal; see [[questions/vocal-fix-first-gold-has-no-caller]].

## Connections

- **depends_on:** [[entities/route-vf-get-sessions-id]], [[entities/route-vf-post-sessions-id-gold]], [[entities/route-vf-get-sessions-id-audio-area-file]], [[entities/mod-ui-audio]], [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-rune-toggle]], [[entities/ui-ritual-progress]], [[entities/ui-oracle-status]], [[entities/ui-sigil-loader]], [[entities/ui-waveform]], [[entities/ui-grimoire-player]], [[entities/ui-voice-sigil]]
- **used_by:** [[entities/route-vf-page-session-id]]
- **related:** [[concepts/gold-vocal]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte`
