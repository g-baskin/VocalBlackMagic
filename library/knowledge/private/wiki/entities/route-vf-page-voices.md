---
type: entity
title: "Vocal Fix page /voices"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/voices/+page.svelte"
language: svelte
depends_on:
  - "[[entities/route-vf-get-voices]]"
  - "[[entities/route-vf-delete-voices-voice-id]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/mod-contracts-voice]]"
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-oracle-status]]"
  - "[[entities/ui-sigil-loader]]"
  - "[[entities/ui-sigil]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: PAGE
route_path: "/voices"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-voice-forge]]"
sources:
  - "apps/vocal-fix/src/routes/voices/+page.svelte"
---

# Vocal Fix page /voices

## Overview

The Codex of trained voices (`apps/vocal-fix/src/routes/voices/+page.svelte:1-238`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- Lists voices from `/api/voices` (`apps/vocal-fix/src/routes/voices/+page.svelte:28-37`).
- `revoke` confirms, then sends DELETE with no `x-vbm-intent` header, which the guard rejects with 415 (`apps/vocal-fix/src/routes/voices/+page.svelte:43-64`, `apps/vocal-fix/src/lib/server/gate.ts:38-42`). See [[questions/vocal-fix-voice-revoke-missing-intent-header]].
- Links each voice to its source session (`apps/vocal-fix/src/routes/voices/+page.svelte:132`).

## Connections

- **depends_on:** [[entities/route-vf-get-voices]], [[entities/route-vf-delete-voices-voice-id]], [[entities/mod-contracts]], [[entities/mod-contracts-voice]], [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-oracle-status]], [[entities/ui-sigil-loader]], [[entities/ui-sigil]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/vocal-fix-voice-forge]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/voices/+page.svelte`
