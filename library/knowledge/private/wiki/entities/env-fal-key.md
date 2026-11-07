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
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/ext-queue-fal-run]]"
sources:
  - "apps/ttb-studio/src/env.ts"
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
  - ".env.example"
---

# FAL_KEY

> [!contradiction]
> Updated in place at HEAD `b58d457`; change introduced in commit `f88cc09`.
> Prior claim: readers are only the capabilities and generation routes (`.env.example:10` placeholder).
> New claim: also read by the studio context (`apps/ttb-studio/src/lib/server/studio/context.ts:4`, `:21`) feeding studio runners and edits; placeholder moved to `.env.example:11`.

## Overview

fal.ai API key for ACE-Step generation and ACE-Step v1 edits (`apps/ttb-studio/src/env.ts:7-10`).

## Signature / Definition

```text
FAL_KEY
```

## Behavior

- Readers: `apps/ttb-studio/src/env.ts:7-10`; `apps/ttb-studio/src/routes/api/capabilities/+server.ts:2`; `apps/ttb-studio/src/routes/api/generations/+server.ts:1`, `:50-55` (503 when missing); `apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:1`; `apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:1`; studio context `apps/ttb-studio/src/lib/server/studio/context.ts:4`, `:21`, `:26`; sent only as the fal authorization header (`apps/ttb-studio/src/lib/server/music/fal.ts:55`).
- Default: none; unset disables fal paths (`apps/ttb-studio/src/env.ts:3`). Placeholder at `.env.example:11`.
- Validation: `optionalKey` trims; empty becomes undefined (`apps/ttb-studio/src/env.ts:4`), and `configuredKey` trims again (`apps/ttb-studio/src/lib/server/music/gate.ts:14-17`). No format check.
- Secrecy: secret, server only via `$app/env/private`; `.env.example` holds only a commented empty placeholder and real values belong in the git-ignored `apps/ttb-studio/.env` (`.env.example:10`). Never logged by name here (not exhaustively verified).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-studio-context]], [[entities/mod-music-fal]], [[entities/mod-studio-edit]], [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]]
- **related:** [[entities/ext-queue-fal-run]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/env.ts`
- `apps/ttb-studio/src/lib/server/studio/context.ts`
- `.env.example`

> [!stale]
> The prior version of this page (built at `29c84e4`) said: readers are only the capabilities and generation routes (`.env.example:10` placeholder).
> See the [!contradiction] callout above for the HEAD state.
