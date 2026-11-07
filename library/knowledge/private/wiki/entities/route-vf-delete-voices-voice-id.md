---
type: entity
title: "Vocal Fix DELETE /api/voices/[voice_id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/voices/[voice_id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-vf-service]]"
used_by:
  - "[[entities/route-vf-page-voices]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: DELETE
route_path: "/api/voices/[voice_id]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-voice-forge]]"
  - "[[concepts/consent-record]]"
  - "[[concepts/vocal-fix-mutation-guard]]"
sources:
  - "apps/vocal-fix/src/routes/api/voices/[voice_id]/+server.ts"
---

# Vocal Fix DELETE /api/voices/[voice_id]

## Overview

Revokes a trained voice (`apps/vocal-fix/src/routes/api/voices/[voice_id]/+server.ts:6-15`).

## Signature / Definition

```ts
export const DELETE: RequestHandler
```

## Behavior

- `guardMutation` with `json: false` requires `x-vbm-intent` (`apps/vocal-fix/src/routes/api/voices/[voice_id]/+server.ts:7-8`).
- `revokeVoice` deletes the voice JSON and model ZIP and adds `voice_revoked` to the source session; 204 (`apps/vocal-fix/src/routes/api/voices/[voice_id]/+server.ts:9-14`, `apps/vocal-fix/src/lib/server/service.ts:786-799`).
- The Codex page calls it without that header (`apps/vocal-fix/src/routes/voices/+page.svelte:54`); see [[questions/vocal-fix-voice-revoke-missing-intent-header]].

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-service]]
- **used_by:** [[entities/route-vf-page-voices]]
- **related:** [[concepts/vocal-fix-voice-forge]], [[concepts/consent-record]], [[concepts/vocal-fix-mutation-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/voices/[voice_id]/+server.ts`
