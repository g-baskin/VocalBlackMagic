---
type: entity
title: "TTB_STUDIO_API_URL"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: ".env.example"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-ttb-studio-python-app]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[questions/is-ttb-studio-backend-ts-dead-code]]"
sources:
  - ".env.example"
  - "apps/ttb-studio/src/lib/server/backend.ts"
---

# TTB_STUDIO_API_URL

## Overview

Legacy URL of the Python TTB Studio prototype; `.env.example` says only unused legacy code reads it (`.env.example:2`).

## Signature / Definition

```text
TTB_STUDIO_API_URL
```

## Behavior

- Readers: `apps/ttb-studio/src/lib/server/backend.ts:3`; no importer of that module found (grep for `server/backend'` in apps/ttb-studio/src).
- Default: `http://127.0.0.1:8002` (`apps/ttb-studio/src/lib/server/backend.ts:3`); example `.env.example:6`.
- Validation: trailing slashes stripped.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-ttb-studio-python-app]]
- **related:** [[questions/is-ttb-studio-backend-ts-dead-code]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `d181ff0` ("Document two-app architecture, sound profiles and rights-cleared vocals") on 2026-11-05
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `.env.example`
- `apps/ttb-studio/src/lib/server/backend.ts`
