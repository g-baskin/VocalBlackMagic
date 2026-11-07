---
type: entity
title: "studio/paths.ts (data dir and localhost check)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/paths.ts"
language: ts
depends_on:
  - "[[entities/env-vbm-data-dir]]"
used_by:
  - "[[entities/mod-studio-context]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-song-library]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/paths.ts"
---

# studio/paths.ts (data dir and localhost check)

## Overview

Resolves the studio data directory and decides whether a Host header names the local machine.

## Signature / Definition

```ts
export function resolveDataDir(env: string | undefined, cwd: string): string
export function dataDir(): string
export function isLocalHost(host: string | null): boolean
```

## Behavior

- `resolveDataDir` uses a non-blank `VBM_DATA_DIR`, else `<nearest ancestor holding bun.lock>/data`, else `<cwd>/data` (`apps/ttb-studio/src/lib/server/studio/paths.ts:5-14`).
- `dataDir` reads `process.env.VBM_DATA_DIR` and `process.cwd()` at call time (`apps/ttb-studio/src/lib/server/studio/paths.ts:16-18`).
- `isLocalHost` strips a port and accepts only `localhost`, `127.0.0.1` and `[::1]`; a missing header is refused (`apps/ttb-studio/src/lib/server/studio/paths.ts:21-25`).

## Connections

- **depends_on:** [[entities/env-vbm-data-dir]]
- **used_by:** [[entities/mod-studio-context]]
- **related:** [[concepts/studio-song-library]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/paths.ts`
