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
  - "[[entities/mod-vf-gate]]"
  - "[[entities/route-vf-post-references]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/production-403-guard]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/gate.ts"
  - "apps/vocal-fix/src/lib/server/gate.ts"
  - "infra/systemd/vbm-ttb-studio.service"
  - "infra/systemd/vbm-vocal-fix.service"
---

# NODE_ENV

> [!contradiction]
> Updated in place at HEAD `b58d457`; change introduced in commit `f88cc09`.
> Prior claim: readers are the TTB Studio gate and the two Vocal Fix reference routes.
> New claim: Vocal Fix also has its own gate module reading it (`apps/vocal-fix/src/lib/server/gate.ts:3`).

## Overview

Only `development` enables hosted generation and Vocal Fix reference uploads (`apps/ttb-studio/src/lib/server/music/gate.ts:1-4`).

## Signature / Definition

```text
NODE_ENV
```

## Behavior

- Readers: `apps/ttb-studio/src/lib/server/music/gate.ts:3`; `apps/vocal-fix/src/lib/server/gate.ts:3`; `apps/vocal-fix/src/routes/api/references/+server.ts:7`; `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:7`, `:27`; set to `production` by both units (`infra/systemd/vbm-ttb-studio.service:10`, `infra/systemd/vbm-vocal-fix.service:10`).
- Default: unset is treated as not development (403).
- Validation: strict equality with `development`.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-gate]], [[entities/mod-vf-gate]], [[entities/route-vf-post-references]]
- **related:** [[concepts/dev-only-generation-gate]], [[concepts/production-403-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/gate.ts`
- `apps/vocal-fix/src/lib/server/gate.ts`
- `infra/systemd/vbm-ttb-studio.service`
- `infra/systemd/vbm-vocal-fix.service`

> [!stale]
> The prior version of this page (built at `29c84e4`) said: readers are the TTB Studio gate and the two Vocal Fix reference routes.
> See the [!contradiction] callout above for the HEAD state.
