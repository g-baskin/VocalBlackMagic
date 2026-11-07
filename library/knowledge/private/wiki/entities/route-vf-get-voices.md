---
type: entity
title: "Vocal Fix GET /api/voices"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/voices/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-vf-forge]]"
used_by:
  - "[[entities/route-vf-page-voices]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: GET
route_path: "/api/voices"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-voice-forge]]"
sources:
  - "apps/vocal-fix/src/routes/api/voices/+server.ts"
---

# Vocal Fix GET /api/voices

## Overview

Lists the shared voice registry (`apps/vocal-fix/src/routes/api/voices/+server.ts:1-9`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Development only, then returns every readable registry voice with `no-store` (`apps/vocal-fix/src/routes/api/voices/+server.ts:5-9`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-svc]], [[entities/mod-vf-forge]]
- **used_by:** [[entities/route-vf-page-voices]]
- **related:** [[concepts/vocal-fix-voice-forge]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/voices/+server.ts`
