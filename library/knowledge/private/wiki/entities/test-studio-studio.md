---
type: entity
title: "studio/studio.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/studio.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-studio-master]]"
  - "[[entities/mod-studio-paths]]"
  - "[[entities/mod-studio-range]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-studio-voices]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-gold]]"
  - "[[entities/mod-studio-voicesummon]]"
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
  - "apps/ttb-studio/src/lib/server/studio/studio.test.ts"
---

# studio/studio.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/studio.test.ts
```

## Behavior

- Replicate adapter (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:79-151`).
- engines (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:153-185`).
- lyrics prompt and parsing (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:187-206`).
- song library, data dir, range parsing (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:208-303`).
- voice registry (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:305-318`).
- studio master ffmpeg args and loudnorm parsing (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:320-358`).
- studio jobs end to end with mocked providers (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:360-493`).
- voice model file (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:495-520`).
- cover art (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:522-598`).
- security limits and localhost guard (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:600-625`).
- summon in my voice: Gold Vocal and music-01 lyrics (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:627-771`).

## Connections

- **depends_on:** [[entities/mod-studio-create]], [[entities/mod-studio-engines]], [[entities/mod-studio-jobs]], [[entities/mod-studio-library]], [[entities/mod-studio-lyrics]], [[entities/mod-studio-master]], [[entities/mod-studio-paths]], [[entities/mod-studio-range]], [[entities/mod-studio-replicate]], [[entities/mod-studio-voices]], [[entities/mod-studio-derive]], [[entities/mod-studio-cover]], [[entities/mod-studio-gold]], [[entities/mod-studio-voicesummon]], [[entities/mod-contracts-studio]], [[entities/mod-music-errors]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/studio.test.ts`
