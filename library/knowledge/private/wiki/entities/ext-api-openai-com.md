---
type: entity
title: "api.openai.com"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/lyrics.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-studio-lyrics]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "api"
related:
  - "[[entities/env-openai-api-key]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/lyrics.ts"
---

# api.openai.com

## Overview

OpenAI Chat Completions, lyricist fallback (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:147-165`).

## Signature / Definition

```text
https://api.openai.com
```

## Behavior

- Kind: Real API call target: the server sends requests to this host.
- Caller: POST `/v1/chat/completions`, Bearer, model `gpt-6-luna`, `reasoning_effort: low` (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:123`, `:149-157`)

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-studio-lyrics]]
- **related:** [[entities/env-openai-api-key]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/lyrics.ts`
