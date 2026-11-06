---
type: entity
title: "music/prompt.ts (style text and sung lyrics)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/prompt.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-generation-request]]"
used_by:
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/route-ttb-post-generations]]"
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
  - "apps/ttb-studio/src/lib/server/music/prompt.ts"
---

# music/prompt.ts (style text and sung lyrics)

## Overview

Builds provider-neutral text from a `GenerationRequest` (`apps/ttb-studio/src/lib/server/music/prompt.ts:1-15`).

## Signature / Definition

```ts
export function styleDescription(request: GenerationRequest): string
export function sungLyrics(request: GenerationRequest): string | null
```

## Behavior

- `styleDescription` is the trimmed prompt plus a `Sound character:` line using `soundCharacterNames` (`apps/ttb-studio/src/lib/server/music/prompt.ts:3-10`).
- `sungLyrics` returns trimmed lyrics only when `mode` is `full-song` and lyrics are non-empty, otherwise null (`apps/ttb-studio/src/lib/server/music/prompt.ts:12-15`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/contract-generation-request]]
- **used_by:** [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/route-ttb-post-generations]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]
- [[entities/test-lyrics]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/prompt.ts`
