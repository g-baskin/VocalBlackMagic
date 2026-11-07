---
type: entity
title: "lib/server/svc.ts (service accessor)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/svc.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-context]]"
  - "[[entities/mod-vf-env]]"
  - "[[entities/env-replicate-api-token]]"
used_by:
  - "[[entities/route-vf-get-capabilities]]"
  - "[[entities/route-vf-post-sessions]]"
  - "[[entities/route-vf-get-sessions-id]]"
  - "[[entities/route-vf-delete-sessions-id]]"
  - "[[entities/route-vf-get-sessions-id-audio-area-file]]"
  - "[[entities/route-vf-post-sessions-id-diagnose]]"
  - "[[entities/route-vf-post-sessions-id-forge]]"
  - "[[entities/route-vf-post-sessions-id-gold]]"
  - "[[entities/route-vf-get-sessions-id-jobs-job]]"
  - "[[entities/route-vf-delete-sessions-id-jobs-job]]"
  - "[[entities/route-vf-post-sessions-id-repair]]"
  - "[[entities/route-vf-get-voices]]"
  - "[[entities/route-vf-delete-voices-voice-id]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - vocal-fix
related: []
sources:
  - "apps/vocal-fix/src/lib/server/svc.ts"
---

# lib/server/svc.ts (service accessor)

## Overview

Route-facing accessor for the service (`apps/vocal-fix/src/lib/server/svc.ts:1-4`).

## Signature / Definition

```ts
export const svc: () => VocalFixService
```

## Behavior

- `svc()` returns the singleton service, passing a callback that reads `REPLICATE_API_TOKEN` from `$app/env/private`, trimmed, or null (`apps/vocal-fix/src/lib/server/svc.ts:1-4`).

## Connections

- **depends_on:** [[entities/mod-vf-context]], [[entities/mod-vf-env]], [[entities/env-replicate-api-token]]
- **used_by:** [[entities/route-vf-get-capabilities]], [[entities/route-vf-post-sessions]], [[entities/route-vf-get-sessions-id]], [[entities/route-vf-delete-sessions-id]], [[entities/route-vf-get-sessions-id-audio-area-file]], [[entities/route-vf-post-sessions-id-diagnose]], [[entities/route-vf-post-sessions-id-forge]], [[entities/route-vf-post-sessions-id-gold]], [[entities/route-vf-get-sessions-id-jobs-job]], [[entities/route-vf-delete-sessions-id-jobs-job]], [[entities/route-vf-post-sessions-id-repair]], [[entities/route-vf-get-voices]], [[entities/route-vf-delete-voices-voice-id]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/svc.ts`
