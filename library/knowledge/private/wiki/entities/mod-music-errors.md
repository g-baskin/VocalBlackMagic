---
type: entity
title: "music/errors.ts (ProviderError)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/errors.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-music-audio]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
  - "[[entities/test-music]]"
  - "[[entities/test-lyrics]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-music]]"
  - "[[entities/test-lyrics]]"
tags:
  - entity
  - module
  - ttb-studio
related:
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/errors.ts"
---

# music/errors.ts (ProviderError)

## Overview

Defines `ProviderError`, which carries an HTTP status, a public message and an optional log-only detail, and `errorResponse`, which converts any thrown value into a JSON error response (`apps/ttb-studio/src/lib/server/music/errors.ts:1-29`).

## Signature / Definition

```ts
export class ProviderError extends Error { status; publicMessage; logDetail? }
export function errorResponse(error: unknown): Response
```

## Behavior

- A `ProviderError` logs `logDetail` to the console and returns `{detail: publicMessage}` with its own status (`apps/ttb-studio/src/lib/server/music/errors.ts:12-15`).
- Any other error is logged by message; a `DOMException` named `TimeoutError` maps to 504, everything else to 502 (`apps/ttb-studio/src/lib/server/music/errors.ts:16-28`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-audio]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/test-music]], [[entities/test-lyrics]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]
- [[entities/test-lyrics]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/errors.ts`
