---
type: entity
title: "lib/server/errors.ts (VocalFixError)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/errors.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-vf-service]]"
  - "[[entities/mod-vf-storage]]"
  - "[[entities/mod-vf-media]]"
  - "[[entities/mod-vf-jobs]]"
  - "[[entities/mod-vf-replicate]]"
  - "[[entities/mod-vf-forge]]"
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
  - "[[entities/route-vf-delete-voices-voice-id]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
related: []
sources:
  - "apps/vocal-fix/src/lib/server/errors.ts"
---

# lib/server/errors.ts (VocalFixError)

## Overview

Typed error and JSON error mapper (`apps/vocal-fix/src/lib/server/errors.ts:1-16`).

## Signature / Definition

```ts
export class VocalFixError extends Error { readonly status: number }
export function errorResponse(error: unknown): Response
```

## Behavior

- `VocalFixError` carries an HTTP status, default 422 (`apps/vocal-fix/src/lib/server/errors.ts:1-9`).
- `errorResponse` returns `{detail}` with that status for a `VocalFixError`, and logs then returns a generic 500 for anything else (`apps/vocal-fix/src/lib/server/errors.ts:11-16`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-vf-service]], [[entities/mod-vf-storage]], [[entities/mod-vf-media]], [[entities/mod-vf-jobs]], [[entities/mod-vf-replicate]], [[entities/mod-vf-forge]], [[entities/route-vf-post-sessions]], [[entities/route-vf-get-sessions-id]], [[entities/route-vf-delete-sessions-id]], [[entities/route-vf-get-sessions-id-audio-area-file]], [[entities/route-vf-post-sessions-id-diagnose]], [[entities/route-vf-post-sessions-id-forge]], [[entities/route-vf-post-sessions-id-gold]], [[entities/route-vf-get-sessions-id-jobs-job]], [[entities/route-vf-delete-sessions-id-jobs-job]], [[entities/route-vf-post-sessions-id-repair]], [[entities/route-vf-delete-voices-voice-id]]
- **related:** none

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/errors.ts`
