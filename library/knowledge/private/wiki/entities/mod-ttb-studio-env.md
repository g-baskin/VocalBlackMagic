---
type: entity
title: "ttb-studio env.ts (declared private env vars)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/env.ts"
language: ts
depends_on:
  - "[[entities/env-fal-key]]"
  - "[[entities/env-replicate-api-token]]"
  - "[[entities/env-vbm-engine-url]]"
  - "[[entities/env-vbm-engine-token]]"
  - "[[entities/env-minimax-api-key]]"
  - "[[entities/env-elevenlabs-api-key]]"
  - "[[entities/env-anthropic-api-key]]"
  - "[[entities/env-openai-api-key]]"
  - "[[entities/env-gemini-api-key]]"
used_by:
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
  - "[[entities/mod-studio-context]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - config
related: []
sources:
  - "apps/ttb-studio/src/env.ts"
---

# ttb-studio env.ts (declared private env vars)

> [!contradiction]
> Contract changed between `29c84e4` and `09057ad` (HEAD `b58d457`).
> Prior contract: 2 variables.
> New contract: 9 variables (`apps/ttb-studio/src/env.ts:6-44`).

## Overview

Declares TTB Studio private environment variables through `defineEnvVars` (`apps/ttb-studio/src/env.ts:1-44`).

## Signature / Definition

```ts
export const variables = defineEnvVars({ FAL_KEY, REPLICATE_API_TOKEN, VBM_ENGINE_URL, VBM_ENGINE_TOKEN, MINIMAX_API_KEY, ELEVENLABS_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY })
```

## Behavior

- Every variable is optional: trimmed, empty becomes undefined, so the app starts without keys (`apps/ttb-studio/src/env.ts:3-4`).
- Declared: `FAL_KEY` (`apps/ttb-studio/src/env.ts:7-10`), `REPLICATE_API_TOKEN` (`apps/ttb-studio/src/env.ts:11-14`), `VBM_ENGINE_URL` and `VBM_ENGINE_TOKEN` for a self-hosted engine (`apps/ttb-studio/src/env.ts:15-22`), `MINIMAX_API_KEY` (`apps/ttb-studio/src/env.ts:23-26`), `ELEVENLABS_API_KEY` (`apps/ttb-studio/src/env.ts:27-30`), `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` for the lyricist (`apps/ttb-studio/src/env.ts:31-38`), `GEMINI_API_KEY` for Lyria 3.5 / Lyria 3 Pro and lyricist (`apps/ttb-studio/src/env.ts:39-43`).
- Read from `$app/env/private` by the legacy routes and the studio context (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:2`, `apps/ttb-studio/src/lib/server/studio/context.ts:11`).
- `apps/ttb-studio/src/app.d.ts:1` adds `vite/client` types (for `import.meta.env`); `apps/ttb-studio/src/bun-globals.d.ts:2-19` declares a minimal `Bun` global (`spawn`, `file`, `write`, `which`). Neither declares env vars.
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `09057ad`: only `FAL_KEY` and `GEMINI_API_KEY` were declared.

## Connections

- **depends_on:** [[entities/env-fal-key]], [[entities/env-replicate-api-token]], [[entities/env-vbm-engine-url]], [[entities/env-vbm-engine-token]], [[entities/env-minimax-api-key]], [[entities/env-elevenlabs-api-key]], [[entities/env-anthropic-api-key]], [[entities/env-openai-api-key]], [[entities/env-gemini-api-key]]
- **used_by:** [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/mod-studio-context]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/env.ts`
