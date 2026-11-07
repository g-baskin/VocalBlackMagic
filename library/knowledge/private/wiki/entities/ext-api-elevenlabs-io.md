---
type: entity
title: "api.elevenlabs.io"
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
  - "[[entities/env-elevenlabs-api-key]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/direct.ts"
---

# api.elevenlabs.io

## Overview

ElevenLabs music API (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:102-111`).

## Signature / Definition

```text
https://api.elevenlabs.io
```

## Behavior

- Kind: Real API call target: the server sends requests to this host.
- Caller: POST `/v1/music?output_format=mp3_44100_128`, `xi-api-key`, 600 s (`apps/ttb-studio/src/lib/server/studio/runners/direct.ts:103-110`)

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-studio-runner-direct]]
- **related:** [[entities/env-elevenlabs-api-key]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/direct.ts`
