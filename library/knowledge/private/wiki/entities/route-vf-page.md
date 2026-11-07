---
type: entity
title: "Vocal Fix page /"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/+page.svelte"
language: svelte
depends_on:
  - "[[entities/mod-vf-client]]"
  - "[[entities/route-vf-post-sessions]]"
  - "[[entities/route-vf-post-sessions-id-diagnose]]"
  - "[[entities/ui-arcane-input]]"
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-rune-dropzone]]"
  - "[[entities/ui-rune-recorder]]"
  - "[[entities/ui-rune-toggle]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
  - "[[concepts/reference-session]]"
  - "[[concepts/consent-record]]"
sources:
  - "apps/vocal-fix/src/routes/+page.svelte"
---

# Vocal Fix page /

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior contract: five-file reference upload to `/api/references` with `voice_owner`, capabilities from Python, and a TTB Studio link. New contract: Fix or Forge intake to `/api/sessions` followed by diagnosis (`apps/vocal-fix/src/routes/+page.svelte:66-86`).

## Overview

Intake page for Vocal Fix sessions (`apps/vocal-fix/src/routes/+page.svelte:1-286`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Two modes: Fix needs one recording, Forge needs five; ready requires the count, a performer of 2+ characters and the rights toggle (`apps/vocal-fix/src/routes/+page.svelte:24-26`).
- `begin` posts a multipart form with `mode`, `performer`, `acknowledged_rights=true` and files to `/api/sessions`, then POSTs `/diagnose` and navigates to `/session/<id>` (`apps/vocal-fix/src/routes/+page.svelte:66-86`).
- Uses dropped files and in-browser recordings (`apps/vocal-fix/src/routes/+page.svelte:25`).

## Prior behavior (stale)

> [!stale]
> Behavior changed in commit `f88cc09` (2026-11-06). Reason: page rebuilt around the SvelteKit pipeline.

- On mount fetched `/api/capabilities` and said only upload exists (`gold_vocal: not-implemented`).
- `upload` POSTed `voice_owner` and `acknowledged_rights=true` to `/api/references`; deleted via `DELETE /api/references/<id>`.
- Linked [[entities/contract-vocal-reference-session]], [[entities/ui-brand-header]], [[entities/ui-status-panel]], [[entities/env-vite-ttb-studio-url]].

## Connections

- **depends_on:** [[entities/mod-vf-client]], [[entities/route-vf-post-sessions]], [[entities/route-vf-post-sessions-id-diagnose]], [[entities/ui-arcane-input]], [[entities/ui-arcane-panel]], [[entities/ui-oracle-status]], [[entities/ui-ritual-progress]], [[entities/ui-rune-button]], [[entities/ui-rune-dropzone]], [[entities/ui-rune-recorder]], [[entities/ui-rune-toggle]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/vocal-fix-repair-pipeline]], [[concepts/reference-session]], [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `88c699c` ("Build responsive SvelteKit 3 Vocal Fix and TTB Studio interfaces with CI") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/+page.svelte`
