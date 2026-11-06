---
type: entity
title: "vocal-fix backend.ts (Python bridge)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/backend.ts"
language: ts
depends_on:
  - "[[entities/env-vocal-fix-api-url]]"
used_by:
  - "[[entities/route-vf-get-capabilities]]"
  - "[[entities/route-vf-post-references]]"
  - "[[entities/route-vf-get-reference]]"
  - "[[entities/route-vf-delete-reference]]"
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - entity
  - module
  - vocal-fix
related:
  - "[[entities/mod-vocal-fix-python-app]]"
sources:
  - "apps/vocal-fix/src/lib/server/backend.ts"
---

# vocal-fix backend.ts (Python bridge)

## Overview

Loopback bridge used by Vocal Fix routes to reach the private Python prototype (`apps/vocal-fix/src/lib/server/backend.ts:1-24`).

## Signature / Definition

```ts
export function upstreamUrl(envKey: string, fallback: string, path: string): string
export function upstreamUnavailable(error: unknown): Response
export function passthrough(upstream: Response): Response
```

## Behavior

- `upstreamUrl` reads `process.env[envKey]` with a fallback, strips trailing slashes and rejects non-http(s) protocols (`apps/vocal-fix/src/lib/server/backend.ts:2-8`).
- `upstreamUnavailable` logs the error message and returns 503 (`apps/vocal-fix/src/lib/server/backend.ts:9-18`).
- `passthrough` streams the upstream body with its status and `no-store` (`apps/vocal-fix/src/lib/server/backend.ts:19-24`).

## Connections

- **depends_on:** [[entities/env-vocal-fix-api-url]]
- **used_by:** [[entities/route-vf-get-capabilities]], [[entities/route-vf-post-references]], [[entities/route-vf-get-reference]], [[entities/route-vf-delete-reference]]
- **related:** [[entities/mod-vocal-fix-python-app]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/lib/server/backend.ts`
