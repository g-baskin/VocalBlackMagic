---
type: entity
title: "studio/create.ts (createSongs entry point)"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/create.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/mod-studio-runner-models]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/mod-studio-runner-engine]]"
used_by:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-seance]]"
  - "[[entities/route-ttb-get-studio-songs]]"
  - "[[entities/route-ttb-post-studio-songs]]"
  - "[[entities/route-ttb-post-studio-lyrics]]"
  - "[[entities/test-studio-studio]]"
  - "[[entities/test-studio-review]]"
  - "[[entities/test-studio-seal]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-studio]]"
  - "[[entities/test-studio-review]]"
  - "[[entities/test-studio-seal]]"
tags:
  - entity
  - function
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-job-lifecycle]]"
  - "[[concepts/studio-models-and-runners]]"
  - "[[concepts/premium-studio]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/create.ts"
---

# studio/create.ts (createSongs entry point)

## Overview

The single entry point for new original songs: picks a voice summon, a routed model, Lyria 3.5, fal ACE-Step or a Replicate engine, writes lyrics when needed, and records a job.

## Signature / Definition

```ts
export interface CreateDeps extends JobContext { gemini; direct?: DirectKeys }
export interface DirectKeys { anthropic; openai; minimax; elevenlabs; engine }
export function lyricistChain(deps: CreateDeps): LyricistChain
export function legacyRequest(request: CreateSongRequest, lyrics: string | null): GenerationRequest
export interface CreateOptions { seanceId?: string }
export async function createSongs(deps, request, options?): Promise<CreateResult>
```

## Behavior

- `legacyRequest` maps a studio request onto `GenerationRequest` for the fal and Lyria 3.5 adapters with `premium_studio: false`, neutral controls and a 120 s default duration (`apps/ttb-studio/src/lib/server/studio/create.ts:74-95`).
- An unknown `model` is 422; a `voice_id` without Replicate is 503; missing keys for the chosen engine are 503 before any spend (`apps/ttb-studio/src/lib/server/studio/create.ts:107-124`).
- The job cap is 3, or 4 when called for a seance (`apps/ttb-studio/src/lib/server/studio/create.ts:126`).
- When vocal lyrics are missing and the model does not write its own (Lyria 3 Pro or Lyria 3.5), lyrics are written via the lyricist chain, limited to 380 characters for a voice summon and 560 for MiniMax 1.5 (`apps/ttb-studio/src/lib/server/studio/create.ts:127-151`).
- Title falls back to the written title, then the first five prompt words (`apps/ttb-studio/src/lib/server/studio/create.ts:63-71`, `apps/ttb-studio/src/lib/server/studio/create.ts:152`); engine or model limits are checked last (422) (`apps/ttb-studio/src/lib/server/studio/create.ts:153-158`).
- The plan records mode, duration, sound character, `lyrics_written_by_ai`, `cover` (only when Replicate is configured), optional `seance_id` and an estimated cost (`apps/ttb-studio/src/lib/server/studio/create.ts:160-180`).
- Dispatch order: voice summon (`apps/ttb-studio/src/lib/server/studio/create.ts:183-190`); routed model, either queued tasks or synchronous results stored at once with cover art (`apps/ttb-studio/src/lib/server/studio/create.ts:191-242`); Lyria 3.5 per take, stored inline (`apps/ttb-studio/src/lib/server/studio/create.ts:243-262`); fal or Replicate tasks (`apps/ttb-studio/src/lib/server/studio/create.ts:263-279`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/mod-contracts-studio]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-studio-engines]], [[entities/mod-studio-jobs]], [[entities/mod-studio-lyrics]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-runner-models]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-runner-engine]]
- **used_by:** [[entities/mod-studio-context]], [[entities/mod-studio-seance]], [[entities/route-ttb-get-studio-songs]], [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-post-studio-lyrics]], [[entities/test-studio-studio]], [[entities/test-studio-review]], [[entities/test-studio-seal]]
- **related:** [[concepts/studio-job-lifecycle]], [[concepts/studio-models-and-runners]], [[concepts/premium-studio]]

## Tested by

- [[entities/test-studio-studio]]
- [[entities/test-studio-review]]
- [[entities/test-studio-seal]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/create.ts`
