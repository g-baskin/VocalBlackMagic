---
type: entity
title: "lib/client.ts (browser API helper)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/client.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/route-vf-page]]"
  - "[[entities/route-vf-page-session-id]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - vocal-fix
  - client
related:
  - "[[concepts/vocal-fix-mutation-guard]]"
sources:
  - "apps/vocal-fix/src/lib/client.ts"
---

# lib/client.ts (browser API helper)

## Overview

Browser fetch wrapper that satisfies the mutation guard (`apps/vocal-fix/src/lib/client.ts:1-87`).

## Signature / Definition

```ts
export async function api<T>(path, init?): Promise<T>
export const audioUrl: (sid, area, file) => string
export const meterTone: (v: number) => tone
```

## Behavior

- View types for sessions, recordings, versions and diagnosis (`apps/vocal-fix/src/lib/client.ts:2-61`).
- `api` sends JSON with `content-type: application/json`, or adds `x-vbm-intent: vocal-fix` for non-GET calls without JSON, and throws the server `detail` on failure (`apps/vocal-fix/src/lib/client.ts:63-81`).
- `audioUrl` builds `/api/sessions/<id>/audio/<area>/<file>`; `meterTone` maps a score to a tone (`apps/vocal-fix/src/lib/client.ts:83-87`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-vf-page]], [[entities/route-vf-page-session-id]]
- **related:** [[concepts/vocal-fix-mutation-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/client.ts`
