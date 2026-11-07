---
type: entity
title: "lib/server/range.ts (byte-range file responses)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/range.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/route-vf-get-sessions-id-audio-area-file]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
related: []
sources:
  - "apps/vocal-fix/src/lib/server/range.ts"
---

# lib/server/range.ts (byte-range file responses)

## Overview

Serves stored audio with HTTP range support (`apps/vocal-fix/src/lib/server/range.ts:1-61`).

## Signature / Definition

```ts
export function parseRange(header, size): { start; end } | null | 'invalid'
export function fileResponse(file, size, contentType, rangeHeader, downloadName?): Response
```

## Behavior

- Copied from the TTB Studio range helper; the apps share no server code (`apps/vocal-fix/src/lib/server/range.ts:1`).
- `parseRange` handles one `bytes=` range and returns `invalid` for unsatisfiable ones (`apps/vocal-fix/src/lib/server/range.ts:2-23`).
- `fileResponse` sets `private, no-store` and `nosniff`, answers 416, 200 or 206, and sanitizes an optional download name (`apps/vocal-fix/src/lib/server/range.ts:25-61`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-vf-get-sessions-id-audio-area-file]]
- **related:** none

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/range.ts`
