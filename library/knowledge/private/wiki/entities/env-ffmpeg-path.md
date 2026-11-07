---
type: entity
title: "FFMPEG_PATH"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/master.ts"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-studio-master]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/env-vbm-ffmpeg]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/master.ts"
---

# FFMPEG_PATH

## Overview

Explicit ffmpeg path for TTB Studio mastering; a different name from Vocal Fix's `VBM_FFMPEG` (`apps/ttb-studio/src/lib/server/studio/master.ts:4-5`).

## Signature / Definition

```text
FFMPEG_PATH
```

## Behavior

- Readers: `apps/ttb-studio/src/lib/server/studio/master.ts:5`.
- Default: `Bun.which("ffmpeg")`, then `/usr/local/bin/ffmpeg`.
- Validation: trimmed only.
- Secrecy: not a secret. Not listed in `.env.example`.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-studio-master]]
- **related:** [[entities/env-vbm-ffmpeg]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/master.ts`
