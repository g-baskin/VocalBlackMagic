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
  - "[[entities/route-vf-get-capabilities]]"
  - "[[entities/route-vf-post-references]]"
  - "[[entities/route-vf-get-reference]]"
  - "[[entities/route-vf-delete-reference]]"
last_commit_hash: "12fb6e8"
tested_by: []
tags:
  - entity
  - env-var
  - config
related: []
sources:
  - ".env.example"
---

# VOCAL_FIX_API_URL

## Overview

Base URL of the private Python Vocal Fix prototype, read at runtime by the SvelteKit bridge (`.env.example:4`).

## Signature / Definition

```text
VOCAL_FIX_API_URL
```

## Behavior

- Example value is loopback port 8001 (`.env.example:4`); routes pass the name and the same fallback to `upstreamUrl` (`apps/vocal-fix/src/routes/api/references/+server.ts:40`, `apps/vocal-fix/src/lib/server/backend.ts:3`).
- Runtime variable: changing it does not require a rebuild, unlike the `VITE_` link variables.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-vocal-fix-backend]], [[entities/route-vf-get-capabilities]], [[entities/route-vf-post-references]], [[entities/route-vf-get-reference]], [[entities/route-vf-delete-reference]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `d181ff0` ("Document two-app architecture, sound profiles and rights-cleared vocals") on 2026-11-05
- **Last touched:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05

## Sources

- `.env.example`
- `apps/vocal-fix/src/lib/server/backend.ts`
