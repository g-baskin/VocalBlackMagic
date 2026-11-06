---
type: entity
title: "TTB_STUDIO_API_URL"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: ".env.example"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-ttb-studio-backend]]"
last_commit_hash: "12fb6e8"
tested_by: []
tags:
  - entity
  - env-var
  - config
related: []
sources:
  - ".env.example"
---

# TTB_STUDIO_API_URL

## Overview

Base URL of the Python TTB Studio prototype (`.env.example:5`).

## Signature / Definition

```text
TTB_STUDIO_API_URL
```

## Behavior

- Read only by the unused bridge `apps/ttb-studio/src/lib/server/backend.ts:3` with fallback port 8002.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-backend]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `d181ff0` ("Document two-app architecture, sound profiles and rights-cleared vocals") on 2026-11-05
- **Last touched:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05

## Sources

- `.env.example`
- `apps/ttb-studio/src/lib/server/backend.ts`
