---
type: entity
title: "REPLICATE_API_TOKEN"
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
  - "[[entities/mod-vf-env]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-vf-replicate]]"
  - "[[entities/route-ttb-get-capabilities]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/ext-api-replicate-com]]"
sources:
  - "apps/ttb-studio/src/env.ts"
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
  - ".env.example"
---

# REPLICATE_API_TOKEN

## Overview

Replicate token for studio engines, lyrics, stems and voice in TTB Studio, and for Demucs, resemble-enhance and RVC in Vocal Fix (`apps/ttb-studio/src/env.ts:11-14`, `apps/vocal-fix/src/env.ts:7-10`).

## Signature / Definition

```text
REPLICATE_API_TOKEN
```

## Behavior

- Readers: `apps/ttb-studio/src/env.ts:11-14`; `apps/ttb-studio/src/routes/api/capabilities/+server.ts:2`; `apps/ttb-studio/src/lib/server/studio/context.ts:8`, `:20`, `:25`; `apps/vocal-fix/src/env.ts:7-10`; `apps/vocal-fix/src/lib/server/svc.ts:1`, `:4`; sent as Bearer (`apps/ttb-studio/src/lib/server/studio/replicate.ts:36`, `apps/vocal-fix/src/lib/server/replicate.ts:53`).
- Default: none; unset skips that provider. Placeholder at `.env.example:14`.
- Validation: `optionalKey` trims; empty becomes undefined (`apps/ttb-studio/src/env.ts:4`), and `configuredKey` trims again (`apps/ttb-studio/src/lib/server/music/gate.ts:14-17`). No format check.
- Secrecy: secret, server only via `$app/env/private`; `.env.example` holds only a commented empty placeholder and real values belong in the git-ignored `apps/ttb-studio/.env` (`.env.example:10`). Never logged by name here (not exhaustively verified).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-studio-context]], [[entities/mod-vf-env]], [[entities/mod-vf-svc]], [[entities/mod-studio-replicate]], [[entities/mod-vf-replicate]], [[entities/route-ttb-get-capabilities]]
- **related:** [[entities/ext-api-replicate-com]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/env.ts`
- `apps/ttb-studio/src/lib/server/studio/context.ts`
- `.env.example`
