---
type: entity
title: "music/fal.ts (fal ACE-Step adapter)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/fal.ts"
language: ts
depends_on:
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-prompt]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-generation-request]]"
  - "[[entities/ext-queue-fal-run]]"
  - "[[entities/env-fal-key]]"
used_by:
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
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
  - "apps/ttb-studio/src/lib/server/music/fal.ts"
---

# music/fal.ts (fal ACE-Step adapter)

## Overview

Adapter for ACE-Step 1.5 on the fal queue API at `https://queue.fal.run` with app `fal-ai/ace-step-1.5` (`apps/ttb-studio/src/lib/server/music/fal.ts:5-7`).

## Signature / Definition

```ts
export const aceStepMaxPrompt = 512; export const aceStepMaxLyrics = 4096
export function isFalRequestId(id: string): boolean
export function aceStepRequestError(request): string | null
export function buildFalSubmission(request, lyrics): { endpoint; body }
export async function submitFal(deps, request, lyrics): Promise<string>
export async function falStatus(deps, id): Promise<{ status; detail? }>
export function isAllowedFalMediaUrl(raw: string): boolean
export async function falAudioUrl(deps, id): Promise<string>
```

## Behavior

- Request ids must be UUIDs (`apps/ttb-studio/src/lib/server/music/fal.ts:10`, `apps/ttb-studio/src/lib/server/music/fal.ts:17-19`).
- `aceStepRequestError` rejects style text over 512 characters or lyrics over 4096 before any spend (`apps/ttb-studio/src/lib/server/music/fal.ts:21-30`).
- `buildFalSubmission` refuses a full song without lyrics, sends `[Instrumental]` for instrumentals, and sets `thinking: true` and `enable_safety_checker: true` (`apps/ttb-studio/src/lib/server/music/fal.ts:32-53`).
- The key travels only in an `authorization: Key ...` header (`apps/ttb-studio/src/lib/server/music/fal.ts:55-61`); HTTP failures map to 502/402/429/422/404 `ProviderError`s (`apps/ttb-studio/src/lib/server/music/fal.ts:63-77`).
- `submitFal` POSTs with a 15 s timeout and returns the lower-cased `request_id` (`apps/ttb-studio/src/lib/server/music/fal.ts:79-104`); `falStatus` maps `IN_QUEUE`/`IN_PROGRESS`/`COMPLETED` to `queued`/`running`/`completed` or `failed` (`apps/ttb-studio/src/lib/server/music/fal.ts:106-130`).
- `falAudioUrl` accepts only https URLs on `fal.media` subdomains or `storage.googleapis.com/falserverless/` (`apps/ttb-studio/src/lib/server/music/fal.ts:132-160`).

## Connections

- **depends_on:** [[entities/mod-music-errors]], [[entities/mod-music-prompt]], [[entities/mod-contracts]], [[entities/contract-generation-request]], [[entities/ext-queue-fal-run]], [[entities/env-fal-key]]
- **used_by:** [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/test-music]], [[entities/test-lyrics]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]
- [[entities/test-lyrics]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/fal.ts`
