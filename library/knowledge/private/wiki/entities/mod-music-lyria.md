---
type: entity
title: "music/lyria.ts (Google Lyria adapter)"
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
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-runner-direct]]"
  - "[[entities/test-music]]"
  - "[[entities/test-lyrics]]"
last_commit_hash: "09057ad"
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

# music/lyria.ts (Google Lyria adapter)

> [!contradiction]
> Contract changed between `29c84e4` and `09057ad` (HEAD `b58d457`).
> Prior contract: fixed model `lyria-3.5`.
> New contract: optional `model` parameter (`apps/ttb-studio/src/lib/server/music/lyria.ts:78`); env text mentions Lyria 3 Pro (`apps/ttb-studio/src/env.ts:41`).

## Overview

Adapter for Google Lyria through the Interactions API (`apps/ttb-studio/src/lib/server/music/lyria.ts:7-117`).

## Signature / Definition

```ts
export const lyriaModel = 'lyria-3.5'; export const lyriaApiRevision = '2026-05-20'
export function buildLyriaPrompt(request): string
export function parseLyriaInteraction(data: unknown): { audio: InlineAudio; lyrics: string | null }
export async function generateLyria(deps, request, model = lyriaModel): Promise<{ audio; lyrics }>
```

## Behavior

- `buildLyriaPrompt` joins style text, instrumental instruction, lyrics or a write-lyrics request, and target length (`apps/ttb-studio/src/lib/server/music/lyria.ts:15-23`).
- `parseLyriaInteraction` requires audio, verifies it with `inspectBase64Audio` and accepts only MPEG or WAV (`apps/ttb-studio/src/lib/server/music/lyria.ts:35-73`).
- `generateLyria` sends the caller-chosen `model` (default `lyria-3.5`) with the key in `x-goog-api-key` and a 300 s timeout (`apps/ttb-studio/src/lib/server/music/lyria.ts:75-89`); maps 400 to 422, 401/403 to 502, unbilled 429 to 402, other 429 to 429, else 502 (`apps/ttb-studio/src/lib/server/music/lyria.ts:90-114`).
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `09057ad`: `generateLyria(deps, request)` always sent `model: lyria-3.5`; mapping cited at old lines 79-114.

## Connections

- **depends_on:** [[entities/mod-music-audio]], [[entities/mod-music-errors]], [[entities/mod-music-prompt]], [[entities/mod-contracts]], [[entities/contract-inline-audio]], [[entities/ext-generativelanguage-googleapis-com]], [[entities/env-gemini-api-key]]
- **used_by:** [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/mod-studio-create]], [[entities/mod-studio-runner-direct]], [[entities/test-music]], [[entities/test-lyrics]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]
- [[entities/test-lyrics]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/music/lyria.ts`
