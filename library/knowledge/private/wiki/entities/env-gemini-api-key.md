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
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-music-lyria]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-capabilities]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/ext-generativelanguage-googleapis-com]]"
sources:
  - "apps/ttb-studio/src/env.ts"
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
  - ".env.example"
---

# GEMINI_API_KEY

> [!contradiction]
> Updated in place at HEAD `b58d457`; change introduced in commit `f88cc09`.
> Prior claim: used for Lyria generation and automatic lyrics in the generations route only; placeholder `.env.example:11`.
> New claim: also read by the studio context for the lyricist chain and direct Lyria 3 Pro (`apps/ttb-studio/src/lib/server/studio/context.ts:22`, `:27`); placeholder `.env.example:12`.

## Overview

Google Gemini key for Lyria 3.5, Lyria 3 Pro and the Gemini lyricist (`apps/ttb-studio/src/env.ts:39-43`).

## Signature / Definition

```text
GEMINI_API_KEY
```

## Behavior

- Readers: `apps/ttb-studio/src/env.ts:39-43`; `apps/ttb-studio/src/routes/api/generations/+server.ts:61-68`, `:94-98` (503 when missing); `apps/ttb-studio/src/routes/api/capabilities/+server.ts:2`; studio context `apps/ttb-studio/src/lib/server/studio/context.ts:5`, `:22`, `:27`; sent as `x-goog-api-key` (`apps/ttb-studio/src/lib/server/music/lyria.ts:84`, `apps/ttb-studio/src/lib/server/music/lyricist.ts:102`, `apps/ttb-studio/src/lib/server/studio/lyrics.ts:173`).
- Default: none; unset disables Gemini paths. Placeholder at `.env.example:12`.
- Validation: `optionalKey` trims; empty becomes undefined (`apps/ttb-studio/src/env.ts:4`), and `configuredKey` trims again (`apps/ttb-studio/src/lib/server/music/gate.ts:14-17`). No format check.
- Secrecy: secret, server only via `$app/env/private`; `.env.example` holds only a commented empty placeholder and real values belong in the git-ignored `apps/ttb-studio/.env` (`.env.example:10`). Never logged by name here (not exhaustively verified).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-studio-context]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/mod-studio-lyrics]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-capabilities]]
- **related:** [[entities/ext-generativelanguage-googleapis-com]]

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
> The prior version of this page (built at `29c84e4`) said: used for Lyria generation and automatic lyrics in the generations route only; placeholder `.env.example:11`.
> See the [!contradiction] callout above for the HEAD state.
