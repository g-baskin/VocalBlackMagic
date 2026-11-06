---
type: entity
title: "generativelanguage.googleapis.com (Gemini interactions API)"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/lyria.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
last_commit_hash: "29c84e4"
tested_by: []
env_vars:
  - "[[entities/env-gemini-api-key]]"
tags:
  - entity
  - service
  - external
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/lyria.ts"
---

# generativelanguage.googleapis.com (Gemini interactions API)

## Overview

External Google host used for Lyria 3.5 song generation and Gemini lyric drafting via `/v1beta/interactions` (`apps/ttb-studio/src/lib/server/music/lyria.ts:6`, `apps/ttb-studio/src/lib/server/music/lyricist.ts:6`).

## Signature / Definition

```ts
POST https://generativelanguage.googleapis.com/v1beta/interactions  (api-revision 2026-05-20)
```

## Behavior

- Lyria call: model `lyria-3.5`, 300 s timeout (`apps/ttb-studio/src/lib/server/music/lyria.ts:79-88`). Lyricist call: model `gemini-3.5-flash-lite`, `store: false`, 60 s (`apps/ttb-studio/src/lib/server/music/lyricist.ts:98-112`).
- Both send `api-revision` `2026-05-20` (`apps/ttb-studio/src/lib/server/music/lyria.ts:8`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]]
- **related:** [[concepts/hosted-generation-flow]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/lyria.ts`
