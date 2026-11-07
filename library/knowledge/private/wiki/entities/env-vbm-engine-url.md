---
type: entity
title: "VBM_ENGINE_URL"
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
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/env-vbm-engine-token]]"
  - "[[concepts/engine-deployment-targets]]"
sources:
  - "apps/ttb-studio/src/env.ts"
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
  - ".env.example"
---

# VBM_ENGINE_URL

## Overview

Base URL of a self-hosted VBM engine for TTB Studio (`apps/ttb-studio/src/env.ts:15-18`).

## Signature / Definition

```text
VBM_ENGINE_URL
```

## Behavior

- Readers: `apps/ttb-studio/src/env.ts:15-18`; `apps/ttb-studio/src/lib/server/studio/context.ts:10`, `:42`; requests built from it in `apps/ttb-studio/src/lib/server/studio/runners/engine.ts:69`, `:107`.
- Default: none; the engine runner is disabled unless both URL and token are set (`apps/ttb-studio/src/lib/server/studio/context.ts:41-46`). Example `http://127.0.0.1:8090` at `.env.example:16`.
- Validation: trimmed only; no scheme check in the context (`apps/ttb-studio/src/lib/server/studio/context.ts:42`).
- Secrecy: not a secret, but server only; changing it is a runtime change.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-env]], [[entities/mod-studio-context]], [[entities/mod-studio-runner-engine]]
- **related:** [[entities/env-vbm-engine-token]], [[concepts/engine-deployment-targets]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/env.ts`
- `apps/ttb-studio/src/lib/server/studio/context.ts`
- `.env.example`
