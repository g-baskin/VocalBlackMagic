---
type: entity
title: "studio/range.ts (HTTP byte ranges for stored files)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/range.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/route-ttb-get-studio-songs-id-audio]]"
  - "[[entities/route-ttb-get-studio-songs-id-cover]]"
  - "[[entities/route-ttb-post-studio-songs-id-cover]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-song-library]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/range.ts"
---

# studio/range.ts (HTTP byte ranges for stored files)

## Overview

Serves stored audio and cover files with single-range HTTP Range support.

## Signature / Definition

```ts
export function parseRange(header: string | null, size: number): { start: number; end: number } | null | 'invalid'
export function fileResponse(file: string, size: number, contentType: string, rangeHeader: string | null, downloadName?: string): Response
```

## Behavior

- `parseRange` accepts only `bytes=a-b`, `bytes=a-` and suffix `bytes=-n`; `bytes=-0`, empty or out-of-size ranges are `invalid` (`apps/ttb-studio/src/lib/server/studio/range.ts:2-22`).
- Responses carry `accept-ranges`, `private, no-store` and `nosniff`; a download name is sanitised to word characters, dot and dash (`apps/ttb-studio/src/lib/server/studio/range.ts:31-39`).
- An invalid range is a 416 with `content-range: bytes */size`; no range is a 200 of the whole `Bun.file`; a range is a 206 slice (`apps/ttb-studio/src/lib/server/studio/range.ts:40-59`).

## Connections

- **depends_on:** none
- **used_by:** [[entities/route-ttb-get-studio-songs-id-audio]], [[entities/route-ttb-get-studio-songs-id-cover]], [[entities/route-ttb-post-studio-songs-id-cover]]
- **related:** [[concepts/studio-song-library]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/range.ts`
