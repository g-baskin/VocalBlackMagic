---
type: entity
title: "studio/seance.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/seance.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-seance]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-music-errors]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - test
  - ttb-studio
  - studio
  - test
related: []
sources:
  - "apps/ttb-studio/src/lib/server/studio/seance.test.ts"
---

# studio/seance.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/seance.test.ts
```

## Behavior

- validateSeanceRequest (`apps/ttb-studio/src/lib/server/studio/seance.test.ts:100-122`).
- shuffledLabels (`apps/ttb-studio/src/lib/server/studio/seance.test.ts:124-135`).
- startSeance persistence, sealing, refusals, instrumental, no-lyricist 503 (`apps/ttb-studio/src/lib/server/studio/seance.test.ts:137-267`).
- rankSeance once and only finished takes (`apps/ttb-studio/src/lib/server/studio/seance.test.ts:269-295`).
- traversal ids (`apps/ttb-studio/src/lib/server/studio/seance.test.ts:297-305`).
- leaderboard (`apps/ttb-studio/src/lib/server/studio/seance.test.ts:307-365`).

## Connections

- **depends_on:** [[entities/mod-studio-seance]], [[entities/mod-contracts-studio]], [[entities/mod-music-errors]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/seance.test.ts`
