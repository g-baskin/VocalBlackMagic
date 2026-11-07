---
type: entity
title: "lib/server/context.ts (service singleton)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/context.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-paths]]"
  - "[[entities/mod-vf-service]]"
used_by:
  - "[[entities/mod-vf-svc]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - vocal-fix
related: []
sources:
  - "apps/vocal-fix/src/lib/server/context.ts"
---

# lib/server/context.ts (service singleton)

## Overview

Process-wide service holder (`apps/vocal-fix/src/lib/server/context.ts:1-10`).

## Signature / Definition

```ts
export function service(token: () => string | null): VocalFixService
```

## Behavior

- Creates one `VocalFixService` per server process with `dataDir()` and a lazily read token callback (`apps/vocal-fix/src/lib/server/context.ts:4-10`).

## Connections

- **depends_on:** [[entities/mod-vf-paths]], [[entities/mod-vf-service]]
- **used_by:** [[entities/mod-vf-svc]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/context.ts`
