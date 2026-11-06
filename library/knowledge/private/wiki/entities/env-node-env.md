---
type: entity
title: "NODE_ENV"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/gate.ts"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-music-gate]]"
  - "[[entities/route-vf-post-references]]"
  - "[[entities/route-vf-get-reference]]"
  - "[[entities/route-vf-delete-reference]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - env-var
  - config
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/production-403-guard]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/gate.ts"
---

# NODE_ENV

## Overview

Node environment mode; the sole switch for the development-only gates.

## Signature / Definition

```text
NODE_ENV
```

## Behavior

- Hosted generation is allowed only when it equals `development` (`apps/ttb-studio/src/lib/server/music/gate.ts:3`).
- Vocal Fix reference routes return 403 otherwise (`apps/vocal-fix/src/routes/api/references/+server.ts:7`, `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:7`).
- Both systemd units set `NODE_ENV=production` (`infra/systemd/vbm-ttb-studio.service:10`, `infra/systemd/vbm-vocal-fix.service:10`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-gate]], [[entities/route-vf-post-references]], [[entities/route-vf-get-reference]], [[entities/route-vf-delete-reference]]
- **related:** [[concepts/dev-only-generation-gate]], [[concepts/production-403-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/gate.ts`
- `infra/systemd/vbm-ttb-studio.service`
- `infra/systemd/vbm-vocal-fix.service`
