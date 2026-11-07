---
type: entity
title: "ANTHROPIC_API_KEY"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/env.ts"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-ttb-studio-env]]"
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-lyrics]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/ext-api-anthropic-com]]"
sources:
  - "apps/ttb-studio/src/env.ts"
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
  - ".env.example"
---

# ANTHROPIC_API_KEY

## Overview

Anthropic key for the first lyricist in the chain (`apps/ttb-studio/src/env.ts:31-34`).

## Signature / Definition

```text
ANTHROPIC_API_KEY
```

## Behavior

- Readers: `apps/ttb-studio/src/env.ts:31-34`; `apps/ttb-studio/src/lib/server/studio/context.ts:2`, `:29`; sent as `x-api-key` (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:137`).
- Default: none; unset skips that provider. Placeholder at `.env.example:22`.
- Validation: `optionalKey` trims; empty becomes undefined (`apps/ttb-studio/src/env.ts:4`), and `configuredKey` trims again (`apps/ttb-studio/src/lib/server/music/gate.ts:14-17`). No format check.
- Secrecy: secret, server only via `$app/env/private`; `.env.example` holds only a commented empty placeholder and real values belong in the git-ignored `apps/ttb-studio/.env` (`.env.example:10`). Never logged by name here (not exhaustively verified).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-studio-context]], [[entities/mod-studio-lyrics]]
- **related:** [[entities/ext-api-anthropic-com]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/env.ts`
- `apps/ttb-studio/src/lib/server/studio/context.ts`
- `.env.example`
