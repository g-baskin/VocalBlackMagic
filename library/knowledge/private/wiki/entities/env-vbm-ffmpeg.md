---
type: entity
title: "VBM_FFMPEG"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/media.ts"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-vf-media]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/env-ffmpeg-path]]"
sources:
  - "apps/vocal-fix/src/lib/server/media.ts"
---

# VBM_FFMPEG

## Overview

Explicit ffmpeg path for Vocal Fix media work (`apps/vocal-fix/src/lib/server/media.ts:9`).

## Signature / Definition

```text
VBM_FFMPEG
```

## Behavior

- Readers: `apps/vocal-fix/src/lib/server/media.ts:9`.
- Default: `Bun.which("ffmpeg")`, then `/usr/local/bin/ffmpeg` (`apps/vocal-fix/src/lib/server/media.ts:5-7`).
- Validation: trimmed; not checked for existence here.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-vf-media]]
- **related:** [[entities/env-ffmpeg-path]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/media.ts`
