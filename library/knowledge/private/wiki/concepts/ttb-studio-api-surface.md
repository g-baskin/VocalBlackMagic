---
type: concept
title: "TTB Studio API surface"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "/api/studio routes"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/ttb-job-polling]]"
  - "[[concepts/ttb-legacy-generation-api]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio"
---

# TTB Studio API surface

## Definition

The `/api/studio/*` SvelteKit endpoints added in `f88cc09` that the browser uses at HEAD: songs, jobs, lyrics, voices, séances and capabilities.

## How it works

- Writes share one pattern: `guard(request, true)`, `readJson`, a contract validator returning 422, then a studio module call wrapped by `studioError` (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:23-35`).
- Long work returns 202 `{job}` (edit, stems, reimagine, voice) or 202 `{seance}`; synchronous derivations return 201 (master, cover) (`apps/ttb-studio/src/routes/api/studio/songs/[id]/stems/+server.ts:14-17`, `apps/ttb-studio/src/routes/api/studio/songs/[id]/master/+server.ts:14-17`).
- Responses set `cache-control: no-store` (`apps/ttb-studio/src/lib/server/studio/context.ts:48`); browser URLs for audio and covers are built in [[entities/mod-ttb-client-api]] (`apps/ttb-studio/src/lib/client/api.ts:11-20`).

## Why it matters

Song, stem and cover data now persist under a local library, so these endpoints are the surface that must gain auth and tenant scoping before any deployment.

## Examples in this codebase

- [[entities/route-ttb-post-studio-songs]]
- [[entities/route-ttb-post-studio-songs-id-edit]]
- [[entities/route-ttb-get-studio-songs-id-audio]]

## Connections

- **involves entities:** [[entities/mod-studio-context]], [[entities/mod-ttb-client-api]], [[entities/route-ttb-post-studio-songs]], [[entities/route-ttb-get-studio-jobs-id]], [[entities/route-ttb-post-studio-lyrics]], [[entities/route-ttb-get-studio-voices]], [[entities/route-ttb-get-studio-capabilities]]
- **related concepts:** [[concepts/dev-only-generation-gate]], [[concepts/ttb-job-polling]], [[concepts/ttb-legacy-generation-api]]

## Sources

- `apps/ttb-studio/src/routes/api/studio`
