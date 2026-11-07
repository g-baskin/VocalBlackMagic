---
type: entity
title: "TTB Studio GET /api/studio/capabilities"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-music-gate]]"
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-master]]"
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-voices]]"
used_by:
  - "[[entities/route-ttb-page]]"
  - "[[entities/route-ttb-page-seance]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: GET
route_path: "/api/studio/capabilities"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
related:
  - "[[concepts/ttb-studio-api-surface]]"
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts"
---

# TTB Studio GET /api/studio/capabilities

## Overview

Reports what the studio can do now: legacy engines, routed models, and lyric, master and voice readiness (`apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:10-40`).

## Signature / Definition

```ts
export const GET: RequestHandler
```

## Behavior

- Not guarded: it answers in any environment and reports `allowed` from `generationAllowed()` (`apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:11-14`).
- `engines` come from `engineInfos` with Replicate, fal and Gemini presence; `models` from `modelInfos` with self-hosted engine, fal, MiniMax, ElevenLabs, Gemini and Replicate presence (`apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:16-32`).
- `lyrics_ready` needs `allowed` plus Replicate, Gemini, Anthropic or OpenAI; `master_ready` needs the ffmpeg binary to exist; `voices_ready` is the count of usable voices, 0 when not allowed (`apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:33-36`).
- Responds with the `noStore` header (`apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:38`).
- Callers: the summon page (`apps/ttb-studio/src/routes/+page.svelte:227`) and the Séance page (`apps/ttb-studio/src/routes/seance/+page.svelte:60-62`).

## Connections

- **depends_on:** [[entities/mod-music-gate]], [[entities/mod-studio-context]], [[entities/mod-studio-engines]], [[entities/mod-studio-master]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-voices]]
- **used_by:** [[entities/route-ttb-page]], [[entities/route-ttb-page-seance]]
- **related:** [[concepts/ttb-studio-api-surface]], [[concepts/dev-only-generation-gate]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts`
