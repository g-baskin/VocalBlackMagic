---
type: entity
title: "vocal-fix hooks.server.ts (host guard hook)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/hooks.server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - hook
  - security
related:
  - "[[concepts/vocal-fix-mutation-guard]]"
sources:
  - "apps/vocal-fix/src/hooks.server.ts"
---

# vocal-fix hooks.server.ts (host guard hook)

## Overview

Server hook applying the DNS-rebinding guard to API routes (`apps/vocal-fix/src/hooks.server.ts:1-11`).

## Signature / Definition

```ts
export const handle: Handle
```

## Behavior

- For every path starting `/api/`, runs `hostGuard` and returns its 403 before any handler when the Host header is not loopback (`apps/vocal-fix/src/hooks.server.ts:4-11`).
- Non-API paths (pages) are not host-checked by this hook (`apps/vocal-fix/src/hooks.server.ts:6`).
- This blocks DNS rebinding; it is not authentication (see `apps/vocal-fix/src/lib/server/gate.ts:84-96`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/vocal-fix-mutation-guard]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/hooks.server.ts`
