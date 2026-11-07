---
type: entity
title: "studio/edit.ts (extend, repaint and restyle edits)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/edit.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-master]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-studio-runner-router]]"
  - "[[entities/ext-queue-fal-run]]"
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/ep-engine-get-v1-health]]"
used_by:
  - "[[entities/route-ttb-get-studio-songs-id-edit]]"
  - "[[entities/route-ttb-post-studio-songs-id-edit]]"
  - "[[entities/test-studio-edit]]"
  - "[[entities/test-studio-review]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-edit]]"
  - "[[entities/test-studio-review]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-derived-songs]]"
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/edit.ts"
---

# studio/edit.ts (extend, repaint and restyle edits)

## Overview

Suno-style edits of a library song on ACE-Step, routed engine first, then fal ACE-Step v1 edit endpoints. Replicate cannot edit. Each result is a new child song.

## Signature / Definition

```ts
export const falEditApp = 'fal-ai/ace-step'
export const editCosts = { extend: 0.05, repaint: 0.03, cover: 0.05 }
export interface EditDeps extends JobContext { engine?; probe?; probeTimeoutMs? }
export async function ffmpegDuration(file: string): Promise<number | null>
export async function boundedProbe(probe, file, ms): Promise<number | null>
export function parseDuration(text: string): number | null
export async function editCandidates(deps, action, request?, cache?): Promise<Candidate[]>
export async function editInfos(deps, song): Promise<StudioEditInfo[]>
export function engineEditBody(request, parent, source)
export function falEditBody(request, parent, dataUri): Record<string, unknown>
export async function startEdit(deps, parentId, request): Promise<StudioJob>
```

## Behavior

- Actions map to engine tasks, song kinds (`cover` becomes `restyle`) and fal endpoints audio-outpaint, audio-inpaint and audio-to-audio (`apps/ttb-studio/src/lib/server/studio/edit.ts:37-51`); sources are capped at 50 MiB for the engine and 25 MiB for fal (`apps/ttb-studio/src/lib/server/studio/edit.ts:54-55`).
- Duration comes from the ffmpeg banner with a 15 s kill (`apps/ttb-studio/src/lib/server/studio/edit.ts:68-81`); `boundedProbe` treats failure or timeout as unknown (`apps/ttb-studio/src/lib/server/studio/edit.ts:84-99`).
- `editCandidates` reads engine health once per call and checks ace-step-1.5 is ready and offers the task; fal is limited to 107 s extensions and repaints within 240 s; Replicate is always refused (`apps/ttb-studio/src/lib/server/studio/edit.ts:121-172`).
- `editInfos` requires WAV, FLAC or MP3 audio and reports the first usable runner or every reason (`apps/ttb-studio/src/lib/server/studio/edit.ts:175-195`).
- Request bodies: engine protocol v1 with base64 source (`apps/ttb-studio/src/lib/server/studio/edit.ts:198-224`); fal fields with a data URI and `variance` clamped to 0..1 (`apps/ttb-studio/src/lib/server/studio/edit.ts:227-262`).
- `startEdit` refuses a repaint past the measured end before spending (`apps/ttb-studio/src/lib/server/studio/edit.ts:290-307`), applies the job cap, and falls back only on `RunnerRefused` (`apps/ttb-studio/src/lib/server/studio/edit.ts:309-356`).
- It records a runner record with every attempt and whether cover strength was actually applied (engine only) (`apps/ttb-studio/src/lib/server/studio/edit.ts:357-406`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-contracts-engine]], [[entities/mod-music-errors]], [[entities/mod-music-fal]], [[entities/mod-studio-jobs]], [[entities/mod-studio-master]], [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-router]], [[entities/ext-queue-fal-run]], [[entities/ep-engine-post-v1-jobs]], [[entities/ep-engine-get-v1-health]]
- **used_by:** [[entities/route-ttb-get-studio-songs-id-edit]], [[entities/route-ttb-post-studio-songs-id-edit]], [[entities/test-studio-edit]], [[entities/test-studio-review]]
- **related:** [[concepts/studio-derived-songs]], [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-edit]]
- [[entities/test-studio-review]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/edit.ts`
