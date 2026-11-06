---
type: entity
title: "queue.fal.run (fal queue API)"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/fal.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-music-fal]]"
last_commit_hash: "29c84e4"
tested_by: []
env_vars:
  - "[[entities/env-fal-key]]"
tags:
  - entity
  - service
  - external
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/fal.ts"
---

# queue.fal.run (fal queue API)

## Overview

External fal.ai queue host used for ACE-Step 1.5 submission, status and result lookups (`apps/ttb-studio/src/lib/server/music/fal.ts:5-7`).

## Signature / Definition

```ts
https://queue.fal.run/fal-ai/ace-step-1.5[/requests/<id>[/status]]
```

## Behavior

- Submit: POST, 15 s timeout (`apps/ttb-studio/src/lib/server/music/fal.ts:85-90`). Status: GET, 10 s (`apps/ttb-studio/src/lib/server/music/fal.ts:110-113`). Result: GET, 15 s (`apps/ttb-studio/src/lib/server/music/fal.ts:146-149`).
- Media is then fetched from allow-listed hosts `fal.media` or `storage.googleapis.com/falserverless/` (`apps/ttb-studio/src/lib/server/music/fal.ts:132-143`).
- Pricing text in capabilities ("about $0.0006 per second") is a code string, not verified here (`apps/ttb-studio/src/lib/server/music/capabilities.ts:21`) (unverified).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-fal]]
- **related:** [[concepts/hosted-generation-flow]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/fal.ts`
