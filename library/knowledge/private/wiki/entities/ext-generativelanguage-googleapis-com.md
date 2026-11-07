---
type: entity
title: "generativelanguage.googleapis.com"
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
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-studio-runner-direct]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "api"
related:
  - "[[entities/env-gemini-api-key]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/lyria.ts"
  - "apps/ttb-studio/src/lib/server/music/lyricist.ts"
  - "apps/ttb-studio/src/lib/server/studio/lyrics.ts"
---

# generativelanguage.googleapis.com

> [!contradiction]
> Updated in place at HEAD `b58d457`; change introduced in commit `f88cc09`.
> Prior claim: callers are `music/lyria.ts` and `music/lyricist.ts`.
> New claim: the studio lyricist chain also calls `:generateContent` (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:166-170`).

## Overview

Google Gemini API host for Lyria music and Gemini lyricists (`apps/ttb-studio/src/lib/server/music/lyria.ts:6`).

## Signature / Definition

```text
https://generativelanguage.googleapis.com
```

## Behavior

- Kind: Real API call target: the server sends requests to this host.
- Caller: Lyria Interactions POST, 300 s (`apps/ttb-studio/src/lib/server/music/lyria.ts:80-89`), also used for Lyria 3 Pro by the direct runner (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:120-128`)
- Caller: Gemini lyricist Interactions POST, 60 s (`apps/ttb-studio/src/lib/server/music/lyricist.ts:98-112`)
- Caller: studio lyricist chain `models/<model>:generateContent` (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:166-186`)
- Caller: header `api-revision: 2026-05-20` on Interactions calls (`apps/ttb-studio/src/lib/server/music/lyria.ts:8`, `:85`)

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/mod-studio-lyrics]], [[entities/mod-studio-runner-direct]]
- **related:** [[entities/env-gemini-api-key]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/music/lyria.ts`
- `apps/ttb-studio/src/lib/server/music/lyricist.ts`
- `apps/ttb-studio/src/lib/server/studio/lyrics.ts`

> [!stale]
> The prior version of this page (built at `29c84e4`) said: callers are `music/lyria.ts` and `music/lyricist.ts`.
> See the [!contradiction] callout above for the HEAD state.
