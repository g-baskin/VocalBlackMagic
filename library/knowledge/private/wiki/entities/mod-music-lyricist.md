---
type: entity
title: "music/lyricist.ts (automatic lyrics)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/lyricist.ts"
language: ts
depends_on:
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/ext-generativelanguage-googleapis-com]]"
  - "[[entities/env-gemini-api-key]]"
used_by:
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/test-lyrics]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-lyrics]]"
tags:
  - entity
  - module
  - ttb-studio
  - provider
related:
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/lyricist.ts"
---

# music/lyricist.ts (automatic lyrics)

## Overview

Writes lyrics with `gemini-3.5-flash-lite` when an ACE-Step full song has none (`apps/ttb-studio/src/lib/server/music/lyricist.ts:6-9`).

## Signature / Definition

```ts
export const lyricistModel
export function buildLyricistPrompt(request): string
export function realWordCount(text: string): number
export function cleanLyrics(raw: string): string
export async function writeLyrics(deps, request): Promise<string>
```

## Behavior

- The prompt fences the user description in `<description>` tags, strips angle brackets, and picks a section shape by duration (`apps/ttb-studio/src/lib/server/music/lyricist.ts:16-40`).
- `realWordCount` ignores section tags, repeated syllables and filler words (`apps/ttb-studio/src/lib/server/music/lyricist.ts:64-77`); `cleanLyrics` strips code fences, trims to the ACE-Step lyric limit at a line break and rejects text with fewer than 3 real words (`apps/ttb-studio/src/lib/server/music/lyricist.ts:79-95`).
- `writeLyrics` sends `store: false`, minimal thinking and `max_output_tokens: 1500` with a 60 s timeout (`apps/ttb-studio/src/lib/server/music/lyricist.ts:97-112`), logging only Google status fields on failure (`apps/ttb-studio/src/lib/server/music/lyricist.ts:113-142`).

## Connections

- **depends_on:** [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-contracts]], [[entities/ext-generativelanguage-googleapis-com]], [[entities/env-gemini-api-key]]
- **used_by:** [[entities/route-ttb-post-generations]], [[entities/test-lyrics]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-lyrics]]

## History

- **Created:** commit `92d7e00` ("Update TTB Studio to ACE-Step 1.5 with automatic lyrics and FLAC playback (#5)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/lyricist.ts`
