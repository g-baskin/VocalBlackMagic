---
type: concept
title: "Hosted generation flow"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "song generation pipeline"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/premium-studio]]"
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/ttb-legacy-generation-api]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/songs/+server.ts"
  - "apps/ttb-studio/src/routes/api/generations/+server.ts"
---

# Hosted generation flow

## Definition

The path a TTB Studio song request takes from the editor through provider adapters and back as verified audio. Narrative: `library/knowledge/private/architecture/music-generation-pipeline.md`.

## How it works

> [!contradiction]
> Changed in `f88cc09`: the browser no longer uses `/api/generations`. Prior flow: POST `/api/generations`, poll `/api/generations/<id>`, stream `/api/generations/<id>/audio`, no server storage. New flow: POST `/api/studio/songs`, poll `/api/studio/jobs/<id>`, play stored audio from `/api/studio/songs/<id>/audio`.
- The summon page validates with `validateCreateSongRequest` and POSTs `/api/studio/songs` (`apps/ttb-studio/src/routes/+page.svelte:275-291`); the route guards, validates and calls `createSongs`, returning 202 (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:23-35`).
- The page polls `/api/studio/jobs/<id>` every 4 s; each poll calls `advanceJob` (`apps/ttb-studio/src/routes/+page.svelte:254-273`, `apps/ttb-studio/src/routes/api/studio/jobs/[id]/+server.ts:14-17`). Provider calls happen in studio modules owned elsewhere ([[entities/mod-studio-create]], [[entities/mod-studio-jobs]]), which reuse `submitFal`, `generateLyria`, `falStatus`, `falAudioUrl` and `verifiedAudioResponse` (`apps/ttb-studio/src/lib/server/studio/create.ts:3-4`, `apps/ttb-studio/src/lib/server/studio/jobs.ts:15-17`).
- Finished songs are stored and served with range support (`apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts:12-25`).
- > [!stale]
  > Prior claim "No audio is stored server-side" now holds only for the legacy routes ([[concepts/ttb-legacy-generation-api]]), still present at `apps/ttb-studio/src/routes/api/generations/+server.ts:93-109`.

## Why it matters

Provider audio still passes magic-byte verification through the reused audio module, while the studio now persists results, which changes the storage and privacy surface.

## Examples in this codebase

- [[entities/mod-music-fal]]
- [[entities/mod-music-lyria]]
- [[entities/mod-music-audio]]

## Connections

- **involves entities:** [[entities/route-ttb-page]], [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-get-studio-jobs-id]], [[entities/route-ttb-get-studio-songs-id-audio]], [[entities/mod-studio-create]], [[entities/mod-studio-jobs]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-audio]], [[entities/ext-queue-fal-run]], [[entities/ext-generativelanguage-googleapis-com]]
- **related concepts:** [[concepts/dev-only-generation-gate]], [[concepts/premium-studio]], [[concepts/ttb-studio-api-surface]], [[concepts/ttb-job-polling]], [[concepts/ttb-legacy-generation-api]]

## Sources

- `apps/ttb-studio/src/routes/api/studio/songs/+server.ts`
- `apps/ttb-studio/src/routes/api/generations/+server.ts`
