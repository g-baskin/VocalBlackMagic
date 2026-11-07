---
type: entity
title: "lib/client/seance-time.ts (séance transport timing)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/seance-time.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/route-ttb-page-seance]]"
  - "[[entities/test-ttb-client-seance-time]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-ttb-client-seance-time]]"
tags:
  - entity
  - module
  - ttb-studio
  - client
related:
  - "[[concepts/ttb-seance]]"
sources:
  - "apps/ttb-studio/src/lib/client/seance-time.ts"
---

# lib/client/seance-time.ts (séance transport timing)

## Overview

Pure timing helpers for the séance player (`apps/ttb-studio/src/lib/client/seance-time.ts:1-19`).

## Signature / Definition

```ts
export function takeDuration(buffers, label: string | null): number
export function positionIn(position: number, duration: number): number
export function cannotCompare(entries: { status: string; song_id: string | null }[]): boolean
```

## Behavior

- `takeDuration` returns the take's own finite duration or 0 (`apps/ttb-studio/src/lib/client/seance-time.ts:2-8`); `positionIn` clamps into [0, duration] (`apps/ttb-studio/src/lib/client/seance-time.ts:11-13`).
- `cannotCompare` is true when every entry is terminal and fewer than two have a song; empty is false (`apps/ttb-studio/src/lib/client/seance-time.ts:16-19`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-ttb-page-seance]], [[entities/test-ttb-client-seance-time]]
- **related:** [[concepts/ttb-seance]]

## Tested by

- [[entities/test-ttb-client-seance-time]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/seance-time.ts`
