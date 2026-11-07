---
type: entity
title: "lyrics.test.ts (bun:test)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/lyrics.test.ts"
language: ts
depends_on:
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/mod-contracts]]"
used_by: []
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - module
  - test
related: []
sources:
  - "apps/ttb-studio/src/lib/server/music/lyrics.test.ts"
---

# lyrics.test.ts (bun:test)

## Overview

Bun tests for automatic lyrics, ACE-Step limits and Lyria lyric prompts (`apps/ttb-studio/src/lib/server/music/lyrics.test.ts:47-154`).

## Signature / Definition

```ts
test suite
```

## Behavior

- Prompt shape, unstored cheap request, filler rejection, prompt-injection fencing, truncation and error mapping (`apps/ttb-studio/src/lib/server/music/lyrics.test.ts:47-129`).
- ACE-Step limit checks before spend (`apps/ttb-studio/src/lib/server/music/lyrics.test.ts:131-140`).

- Verified unchanged at HEAD `b58d457` (last touched `29c84e4`); cited line ranges still hold.

## Connections

- **depends_on:** [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/mod-contracts]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `92d7e00` ("Update TTB Studio to ACE-Step 1.5 with automatic lyrics and FLAC playback (#5)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/lyrics.test.ts`
