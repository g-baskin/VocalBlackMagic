---
type: entity
title: "lib/server/paths.ts (data directory)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/paths.ts"
language: ts
depends_on:
  - "[[entities/env-vbm-data-dir]]"
used_by:
  - "[[entities/mod-vf-context]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - vocal-fix
  - storage
related:
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal-fix/src/lib/server/paths.ts"
---

# lib/server/paths.ts (data directory)

## Overview

Resolves where sessions, jobs and voices are stored (`apps/vocal-fix/src/lib/server/paths.ts:1-18`).

## Signature / Definition

```ts
export function findRepoRoot(start: string): string
export function dataDir(env?): string
```

## Behavior

- `findRepoRoot` walks up to the nearest folder containing `bun.lock` (`apps/vocal-fix/src/lib/server/paths.ts:4-13`).
- `dataDir` returns `VBM_DATA_DIR` resolved, else `<repo root>/data` (`apps/vocal-fix/src/lib/server/paths.ts:15-18`).

## Connections

- **depends_on:** [[entities/env-vbm-data-dir]]
- **used_by:** [[entities/mod-vf-context]]
- **related:** [[concepts/reference-session]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/paths.ts`
