---
type: entity
title: "TTB Studio seances/_deps.ts (séance wiring)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/seances/_deps.ts"
language: ts
depends_on:
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-seance]]"
used_by:
  - "[[entities/route-ttb-get-studio-seances]]"
  - "[[entities/route-ttb-post-studio-seances]]"
  - "[[entities/route-ttb-get-studio-seances-id]]"
  - "[[entities/route-ttb-post-studio-seances-id-rank]]"
  - "[[entities/route-ttb-get-studio-seances-leaderboard]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-seance]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/seances/_deps.ts"
---

# TTB Studio seances/_deps.ts (séance wiring)

## Overview

Shared helper for the séance routes; the leading underscore keeps SvelteKit from treating it as a route (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:9-53`).

## Signature / Definition

```ts
export function seanceDeps(fetcher: typeof fetch): SeanceDeps
export function seanceError(error: unknown): Response
```

## Behavior

- `seanceDeps` wires the library root, clock, `Math.random`, live `modelInfos`, `createSongs`, `advanceJob` and the job runner lookup (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:10-45`).
- `writeLyrics` is null unless an Anthropic, OpenAI, Gemini or Replicate lyricist is configured, and asks for at most 560 chars (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:13`, `apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:30-41`).
- `seanceError` returns 422 `{detail, refused}` for `SeanceRefused`, else `studioError` (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:49-53`).

## Connections

- **depends_on:** [[entities/mod-music-gate]], [[entities/mod-studio-context]], [[entities/mod-studio-create]], [[entities/mod-studio-jobs]], [[entities/mod-studio-lyrics]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-seance]]
- **used_by:** [[entities/route-ttb-get-studio-seances]], [[entities/route-ttb-post-studio-seances]], [[entities/route-ttb-get-studio-seances-id]], [[entities/route-ttb-post-studio-seances-id-rank]], [[entities/route-ttb-get-studio-seances-leaderboard]]
- **related:** [[concepts/ttb-seance]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/seances/_deps.ts`
