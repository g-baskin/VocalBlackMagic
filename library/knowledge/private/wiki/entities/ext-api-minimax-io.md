---
type: entity
title: "api.minimax.io"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/direct.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-studio-runner-direct]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "api"
related:
  - "[[entities/env-minimax-api-key]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/direct.ts"
---

# api.minimax.io

## Overview

MiniMax music generation (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:62-68`).

## Signature / Definition

```text
https://api.minimax.io
```

## Behavior

- Kind: Real API call target: the server sends requests to this host.
- Caller: POST `/v1/music_generation`, Bearer, 600 s; errors arrive as HTTP 200 with `status_code` (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:63-82`)
- Caller: comment says the paid API closed to new users on 20 Aug 2026 (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:6`) (unverified)

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-studio-runner-direct]]
- **related:** [[entities/env-minimax-api-key]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/direct.ts`
