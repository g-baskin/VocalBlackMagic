---
type: entity
title: "VBM_DATA_DIR"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/paths.ts"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-studio-paths]]"
  - "[[entities/mod-vf-paths]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/env-vfm-data-dir]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/paths.ts"
  - "apps/vocal-fix/src/lib/server/paths.ts"
  - ".env.example"
---

# VBM_DATA_DIR

## Overview

Where the studio library and shared voice registry live, for both SvelteKit apps (`.env.example:24-25`).

## Signature / Definition

```text
VBM_DATA_DIR
```

## Behavior

- Readers: `apps/ttb-studio/src/lib/server/studio/paths.ts:17`; `apps/vocal-fix/src/lib/server/paths.ts:15-17`.
- Default: `<nearest ancestor holding bun.lock>/data` (`apps/ttb-studio/src/lib/server/studio/paths.ts:4-14`, `apps/vocal-fix/src/lib/server/paths.ts:4-13`).
- Validation: trimmed and `path.resolve`d; no existence check here.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-studio-paths]], [[entities/mod-vf-paths]]
- **related:** [[entities/env-vfm-data-dir]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/paths.ts`
- `apps/vocal-fix/src/lib/server/paths.ts`
- `.env.example`
