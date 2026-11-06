---
type: entity
title: "music.test.ts (bun:test)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/music.test.ts"
language: ts
depends_on:
  - "[[entities/mod-music-audio]]"
  - "[[entities/mod-music-capabilities]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-music-jobs]]"
  - "[[entities/mod-music-lyria]]"
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
  - "apps/ttb-studio/src/lib/server/music/music.test.ts"
---

# music.test.ts (bun:test)

## Overview

Bun tests for audio verification, fal and Lyria adapters, capabilities and the request gate (`apps/ttb-studio/src/lib/server/music/music.test.ts:50-321`).

## Signature / Definition

```ts
test suite
```

## Behavior

- Audio sniffing and streaming limits (`apps/ttb-studio/src/lib/server/music/music.test.ts:50-126`); fal adapter (`apps/ttb-studio/src/lib/server/music/music.test.ts:128-209`); Lyria adapter (`apps/ttb-studio/src/lib/server/music/music.test.ts:211-284`); capabilities (`apps/ttb-studio/src/lib/server/music/music.test.ts:286-306`); JSON gate (`apps/ttb-studio/src/lib/server/music/music.test.ts:308-321`).
- Uses injected fetch stubs, so it does not contact providers.

## Connections

- **depends_on:** [[entities/mod-music-audio]], [[entities/mod-music-capabilities]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-gate]], [[entities/mod-music-jobs]], [[entities/mod-music-lyria]], [[entities/mod-contracts]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/music.test.ts`
