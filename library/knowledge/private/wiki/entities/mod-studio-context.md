---
type: entity
title: "studio/context.ts (studio dependency wiring and guard)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/context.ts"
language: ts
depends_on:
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-paths]]"
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/env-anthropic-api-key]]"
  - "[[entities/env-elevenlabs-api-key]]"
  - "[[entities/env-fal-key]]"
  - "[[entities/env-gemini-api-key]]"
  - "[[entities/env-minimax-api-key]]"
  - "[[entities/env-openai-api-key]]"
  - "[[entities/env-replicate-api-token]]"
  - "[[entities/env-vbm-engine-token]]"
  - "[[entities/env-vbm-engine-url]]"
used_by:
  - "[[entities/route-ttb-get-studio-capabilities]]"
  - "[[entities/route-ttb-get-studio-jobs-id]]"
  - "[[entities/route-ttb-delete-studio-jobs-id]]"
  - "[[entities/route-ttb-post-studio-lyrics]]"
  - "[[entities/route-ttb-get-studio-seances]]"
  - "[[entities/route-ttb-post-studio-seances]]"
  - "[[entities/route-ttb-get-studio-seances-id]]"
  - "[[entities/route-ttb-post-studio-seances-id-rank]]"
  - "[[entities/route-ttb-get-studio-seances-leaderboard]]"
  - "[[entities/route-ttb-get-studio-songs]]"
  - "[[entities/route-ttb-post-studio-songs]]"
  - "[[entities/route-ttb-get-studio-songs-id]]"
  - "[[entities/route-ttb-patch-studio-songs-id]]"
  - "[[entities/route-ttb-delete-studio-songs-id]]"
  - "[[entities/route-ttb-get-studio-songs-id-audio]]"
  - "[[entities/route-ttb-get-studio-songs-id-cover]]"
  - "[[entities/route-ttb-post-studio-songs-id-cover]]"
  - "[[entities/route-ttb-get-studio-songs-id-edit]]"
  - "[[entities/route-ttb-post-studio-songs-id-edit]]"
  - "[[entities/route-ttb-post-studio-songs-id-master]]"
  - "[[entities/route-ttb-post-studio-songs-id-reimagine]]"
  - "[[entities/route-ttb-post-studio-songs-id-stems]]"
  - "[[entities/route-ttb-post-studio-songs-id-voice]]"
  - "[[entities/route-ttb-get-studio-voices]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-song-library]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
---

# studio/context.ts (studio dependency wiring and guard)

## Overview

Builds the dependency bundle every studio route uses and the shared request guard (dev gate, localhost-only host check, JSON content type).

## Signature / Definition

```ts
export function studioContext(fetcher: typeof fetch): CreateDeps
export const noStore: { 'cache-control': 'no-store' }
export function guard(request: Request, needsJson: boolean): Response | null
export async function readJson(request: Request): Promise<unknown>
export function studioError(error: unknown): Response
```

## Behavior

- Reads nine private env values through `$app/env/private` (`apps/ttb-studio/src/lib/server/studio/context.ts:1-11`).
- `studioContext` returns a `SongLibrary` on `dataDir()`, nullable Replicate, fal and Gemini deps, a `direct` block of provider keys plus engine deps, and an injected `now` clock (`apps/ttb-studio/src/lib/server/studio/context.ts:19-39`).
- Engine deps exist only when both `VBM_ENGINE_URL` and `VBM_ENGINE_TOKEN` are set; protocol v1 always requires the token (`apps/ttb-studio/src/lib/server/studio/context.ts:41-46`).
- `guard` returns the music gate 403 first, then 403 unless the Host header is localhost (DNS-rebinding guard), then 415 for non-JSON writes (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- `readJson` turns invalid JSON into `undefined` (`apps/ttb-studio/src/lib/server/studio/context.ts:62-68`); `studioError` maps `LibraryError` to its own status and everything else to `errorResponse` (`apps/ttb-studio/src/lib/server/studio/context.ts:70-74`).

## Connections

- **depends_on:** [[entities/mod-music-errors]], [[entities/mod-music-gate]], [[entities/mod-studio-library]], [[entities/mod-studio-paths]], [[entities/mod-studio-create]], [[entities/mod-studio-runner-engine]], [[entities/env-anthropic-api-key]], [[entities/env-elevenlabs-api-key]], [[entities/env-fal-key]], [[entities/env-gemini-api-key]], [[entities/env-minimax-api-key]], [[entities/env-openai-api-key]], [[entities/env-replicate-api-token]], [[entities/env-vbm-engine-token]], [[entities/env-vbm-engine-url]]
- **used_by:** [[entities/route-ttb-get-studio-capabilities]], [[entities/route-ttb-get-studio-jobs-id]], [[entities/route-ttb-delete-studio-jobs-id]], [[entities/route-ttb-post-studio-lyrics]], [[entities/route-ttb-get-studio-seances]], [[entities/route-ttb-post-studio-seances]], [[entities/route-ttb-get-studio-seances-id]], [[entities/route-ttb-post-studio-seances-id-rank]], [[entities/route-ttb-get-studio-seances-leaderboard]], [[entities/route-ttb-get-studio-songs]], [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-get-studio-songs-id]], [[entities/route-ttb-patch-studio-songs-id]], [[entities/route-ttb-delete-studio-songs-id]], [[entities/route-ttb-get-studio-songs-id-audio]], [[entities/route-ttb-get-studio-songs-id-cover]], [[entities/route-ttb-post-studio-songs-id-cover]], [[entities/route-ttb-get-studio-songs-id-edit]], [[entities/route-ttb-post-studio-songs-id-edit]], [[entities/route-ttb-post-studio-songs-id-master]], [[entities/route-ttb-post-studio-songs-id-reimagine]], [[entities/route-ttb-post-studio-songs-id-stems]], [[entities/route-ttb-post-studio-songs-id-voice]], [[entities/route-ttb-get-studio-voices]]
- **related:** [[concepts/studio-song-library]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/context.ts`
