---
type: entity
title: "GEMINI_API_KEY"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/env.ts"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-ttb-studio-env]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/route-ttb-post-generations]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - env-var
  - config
related:
  - "[[entities/ext-generativelanguage-googleapis-com]]"
sources:
  - "apps/ttb-studio/src/env.ts"
---

# GEMINI_API_KEY

## Overview

Google Gemini key with paid Lyria 3.5 access; server only (`apps/ttb-studio/src/env.ts:11-14`).

## Signature / Definition

```text
GEMINI_API_KEY
```

## Behavior

- Commented placeholder in `.env.example:11`.
- Used for Lyria generation and automatic lyrics (`apps/ttb-studio/src/routes/api/generations/+server.ts:61-70`, `apps/ttb-studio/src/routes/api/generations/+server.ts:94-100`); sent in `x-goog-api-key` (`apps/ttb-studio/src/lib/server/music/lyria.ts:83`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-post-generations]]
- **related:** [[entities/ext-generativelanguage-googleapis-com]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/env.ts`
- `.env.example`
