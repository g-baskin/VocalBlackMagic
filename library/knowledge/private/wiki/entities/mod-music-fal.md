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
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/test-music]]"
  - "[[entities/test-lyrics]]"
last_commit_hash: "b58d457"
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

> [!contradiction]
> Contract changed between `29c84e4` and `b58d457` (HEAD `b58d457`).
> Prior contract: private helpers; fixed ACE-Step app for status/result.
> New contract: exports `falHeaders`, `falFailure`; `falStatus`/`falAudioUrl` gain `app` parameter (`apps/ttb-studio/src/lib/server/music/fal.ts:55`, `apps/ttb-studio/src/lib/server/music/fal.ts:63`, `apps/ttb-studio/src/lib/server/music/fal.ts:109`, `apps/ttb-studio/src/lib/server/music/fal.ts:149`). Last touched `b58d457`.

## Overview

Adapter for ACE-Step 1.5 on the fal queue API at `https://queue.fal.run` with default app `fal-ai/ace-step-1.5` (`apps/ttb-studio/src/lib/server/music/fal.ts:5-7`).

## Signature / Definition

```ts
export const aceStepMaxPrompt = 512; export const aceStepMaxLyrics = 4096
export function isFalRequestId(id: string): boolean
export function aceStepRequestError(request): string | null
export function buildFalSubmission(request, lyrics): { endpoint; body }
export function falHeaders(apiKey: string): Record<string, string>
export async function falFailure(response: Response, action: string): Promise<ProviderError>
export async function submitFal(deps, request, lyrics): Promise<string>
export async function falStatus(deps, id, app = falApp): Promise<{ status; detail? }>
export function isAllowedFalMediaUrl(raw: string): boolean
export async function falAudioUrl(deps, id, app = falApp): Promise<string>
```

## Behavior

- Request ids must be UUIDs (`apps/ttb-studio/src/lib/server/music/fal.ts:10`, `apps/ttb-studio/src/lib/server/music/fal.ts:17-19`); `aceStepRequestError` rejects style over 512 or lyrics over 4096 chars before spend (`apps/ttb-studio/src/lib/server/music/fal.ts:21-30`).
- `buildFalSubmission` refuses a full song without lyrics, sends `[Instrumental]` for instrumentals, and sets `thinking: true`, `enable_safety_checker: true` (`apps/ttb-studio/src/lib/server/music/fal.ts:32-53`).
- `falHeaders` puts the key only in `authorization: Key ...` (`apps/ttb-studio/src/lib/server/music/fal.ts:55-61`); `falFailure` maps HTTP failures to 502/402/429/422/404 `ProviderError`s (`apps/ttb-studio/src/lib/server/music/fal.ts:63-77`). Both are now exported and used by studio edit (`apps/ttb-studio/src/lib/server/studio/edit.ts:30`).
- `submitFal` POSTs with a 15 s timeout and returns the lower-cased `request_id` (`apps/ttb-studio/src/lib/server/music/fal.ts:79-104`).
- `falStatus` and `falAudioUrl` take an optional fal `app` (default ACE-Step) so other fal apps can be polled (`apps/ttb-studio/src/lib/server/music/fal.ts:106-131`, `apps/ttb-studio/src/lib/server/music/fal.ts:146-165`); status maps `IN_QUEUE`/`IN_PROGRESS`/`COMPLETED` to `queued`/`running`/`completed` else `failed`.
- Media URLs must be https on `fal.media` subdomains or `storage.googleapis.com/falserverless/` (`apps/ttb-studio/src/lib/server/music/fal.ts:133-144`).
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `f88cc09`: `headers` and `failure` were private; `falStatus(deps, id)` and `falAudioUrl(deps, id)` always used `fal-ai/ace-step-1.5`.

## Connections

- **depends_on:** [[entities/mod-music-errors]], [[entities/mod-music-prompt]], [[entities/mod-contracts]], [[entities/contract-generation-request]], [[entities/ext-queue-fal-run]], [[entities/env-fal-key]]
- **used_by:** [[entities/mod-music-lyricist]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/mod-studio-create]], [[entities/mod-studio-edit]], [[entities/mod-studio-jobs]], [[entities/mod-studio-runner-routed]], [[entities/test-music]], [[entities/test-lyrics]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]
- [[entities/test-lyrics]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/music/fal.ts`
