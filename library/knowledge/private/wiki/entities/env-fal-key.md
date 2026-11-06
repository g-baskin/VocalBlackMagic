---
type: entity
title: "FAL_KEY"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/env.ts"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-ttb-studio-env]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - env-var
  - config
related:
  - "[[entities/ext-queue-fal-run]]"
sources:
  - "apps/ttb-studio/src/env.ts"
---

# FAL_KEY

## Overview

fal.ai API key for ACE-Step generation; server only (`apps/ttb-studio/src/env.ts:7-10`).

## Signature / Definition

```text
FAL_KEY
```

## Behavior

- Commented placeholder in `.env.example:10`; the comment directs real keys to the git-ignored `apps/ttb-studio/.env` (`.env.example:9`).
- Read via `$app/env/private` in the capabilities and generation routes (`apps/ttb-studio/src/routes/api/capabilities/+server.ts:2`, `apps/ttb-studio/src/routes/api/generations/+server.ts:1`); missing key yields 503 (`apps/ttb-studio/src/routes/api/generations/+server.ts:50-55`).
- Sent only in the fal `authorization` header (`apps/ttb-studio/src/lib/server/music/fal.ts:55-61`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-music-fal]], [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]]
- **related:** [[entities/ext-queue-fal-run]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/env.ts`
- `.env.example`
