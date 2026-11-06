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
  - "[[entities/env-gemini-api-key]]"
used_by:
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
last_commit_hash: "29c84e4"
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

## Overview

Declares the TTB Studio private environment variables through `defineEnvVars` from `@sveltejs/kit/env` (`apps/ttb-studio/src/env.ts:1-15`).

## Signature / Definition

```ts
export const variables = defineEnvVars({ FAL_KEY: {...}, GEMINI_API_KEY: {...} })
```

## Behavior

- Both keys use an optional schema that trims and maps empty strings to undefined, so the app starts without keys (`apps/ttb-studio/src/env.ts:3-4`).
- `FAL_KEY` is described as the fal.ai key for ACE-Step and `GEMINI_API_KEY` as the Gemini key with paid Lyria 3.5 access (`apps/ttb-studio/src/env.ts:7-14`).
- Route handlers read the values from `$app/env/private` (`apps/ttb-studio/src/routes/api/generations/+server.ts:1`).

## Connections

- **depends_on:** [[entities/env-fal-key]], [[entities/env-gemini-api-key]]
- **used_by:** [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/env.ts`
