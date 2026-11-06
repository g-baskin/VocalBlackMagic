---
type: entity
title: "music/lyria.ts (Google Lyria 3.5 adapter)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/lyria.ts"
language: ts
depends_on:
  - "[[entities/mod-music-audio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-prompt]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-inline-audio]]"
  - "[[entities/ext-generativelanguage-googleapis-com]]"
  - "[[entities/env-gemini-api-key]]"
used_by:
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/route-ttb-post-generations]]"
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
  - provider
related:
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/lyria.ts"
---

# music/lyria.ts (Google Lyria 3.5 adapter)

## Overview

Adapter for Google Lyria 3.5 through the Gemini interactions endpoint `https://generativelanguage.googleapis.com/v1beta/interactions` (`apps/ttb-studio/src/lib/server/music/lyria.ts:6-8`).

## Signature / Definition

```ts
export const lyriaModel = 'lyria-3.5'; export const lyriaApiRevision = '2026-05-20'
export function buildLyriaPrompt(request): string
export function parseLyriaInteraction(data: unknown): { audio: InlineAudio; lyrics: string | null }
export async function generateLyria(deps, request): Promise<{ audio; lyrics }>
```

## Behavior

- `buildLyriaPrompt` joins style text, an instrumental instruction, supplied lyrics or a request to write lyrics, and a target length (`apps/ttb-studio/src/lib/server/music/lyria.ts:15-23`).
- `parseLyriaInteraction` collects `model_output` audio and text blocks, requires audio, verifies it with `inspectBase64Audio` and accepts only MPEG or WAV (`apps/ttb-studio/src/lib/server/music/lyria.ts:35-73`).
- `generateLyria` sends the key in `x-goog-api-key` with a 300 s timeout (`apps/ttb-studio/src/lib/server/music/lyria.ts:79-88`) and maps 400 to 422, 401/403 to 502, an unbilled 429 to 402 and other 429 to 429 (`apps/ttb-studio/src/lib/server/music/lyria.ts:89-114`).

## Connections

- **depends_on:** [[entities/mod-music-audio]], [[entities/mod-music-errors]], [[entities/mod-music-prompt]], [[entities/mod-contracts]], [[entities/contract-inline-audio]], [[entities/ext-generativelanguage-googleapis-com]], [[entities/env-gemini-api-key]]
- **used_by:** [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/test-music]], [[entities/test-lyrics]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]
- [[entities/test-lyrics]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/lyria.ts`
