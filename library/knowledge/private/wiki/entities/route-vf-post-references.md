---
type: entity
title: "Vocal Fix POST /api/references"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/references/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vocal-fix-backend]]"
  - "[[entities/ep-vf-post-references]]"
  - "[[entities/env-vocal-fix-api-url]]"
  - "[[entities/env-node-env]]"
used_by:
  - "[[entities/route-vf-page]]"
last_commit_hash: "3997ab2"
tested_by: []
route_method: POST
route_path: "/api/references"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/production-403-guard]]"
  - "[[concepts/reference-session]]"
  - "[[concepts/consent-record]]"
  - "[[codegraph]]"
sources:
  - "apps/vocal-fix/src/routes/api/references/+server.ts"
---

# Vocal Fix POST /api/references

## Overview

Validates and forwards a five-recording upload to the Python prototype (`apps/vocal-fix/src/routes/api/references/+server.ts:5-51`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- Fails closed with 403 unless `NODE_ENV` is `development` (`apps/vocal-fix/src/routes/api/references/+server.ts:6-13`).
- Requires exactly five `files` entries (`apps/vocal-fix/src/routes/api/references/+server.ts:20-23`), `acknowledged_rights` equal to `true` (403 otherwise, `apps/vocal-fix/src/routes/api/references/+server.ts:24-28`), a non-blank `voice_owner` (`apps/vocal-fix/src/routes/api/references/+server.ts:29-30`), and each file 1 byte to 25 MiB with a WAV/MP3/FLAC/M4A name (`apps/vocal-fix/src/routes/api/references/+server.ts:3-4`, `apps/vocal-fix/src/routes/api/references/+server.ts:31-37`).
- Forwards the multipart form with a 60 s timeout (`apps/vocal-fix/src/routes/api/references/+server.ts:38-50`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-post-references]], [[entities/env-vocal-fix-api-url]], [[entities/env-node-env]]
- **used_by:** [[entities/route-vf-page]]
- **related:** [[concepts/production-403-guard]], [[concepts/reference-session]], [[concepts/consent-record]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/routes/api/references/+server.ts`
