---
type: entity
title: "VOCAL_FIX_API_URL"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: ".env.example"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-vocal-fix-backend]]"
  - "[[entities/route-vf-post-references]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/mod-vocal-fix-python-app]]"
sources:
  - ".env.example"
  - "apps/vocal-fix/src/lib/server/backend.ts"
---

# VOCAL_FIX_API_URL

## Overview

Runtime URL of the private Python Vocal Fix API that the SvelteKit reference routes proxy to (`.env.example:1`, `.env.example:5`).

## Signature / Definition

```text
VOCAL_FIX_API_URL
```

## Behavior

- Readers: `apps/vocal-fix/src/lib/server/backend.ts:2-8` via `process.env[envKey]`; `apps/vocal-fix/src/routes/api/references/+server.ts:43`; `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:15`, `:37`.
- Default: `http://127.0.0.1:8001` fallback at each call site; example `.env.example:5`.
- Validation: must be http or https or the call throws (`apps/vocal-fix/src/lib/server/backend.ts:4-6`); trailing slashes stripped.
- Secrecy: not a secret. Runtime, no rebuild needed.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-vocal-fix-backend]], [[entities/route-vf-post-references]]
- **related:** [[entities/mod-vocal-fix-python-app]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `d181ff0` ("Document two-app architecture, sound profiles and rights-cleared vocals") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `.env.example`
- `apps/vocal-fix/src/lib/server/backend.ts`
