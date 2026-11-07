---
type: entity
title: "ttb-studio backend.ts (unused Python bridge)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/backend.ts"
language: ts
depends_on:
  - "[[entities/env-ttb-studio-api-url]]"
used_by: []
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
related:
  - "[[entities/mod-ttb-studio-python-app]]"
  - "[[questions/is-ttb-studio-backend-ts-dead-code]]"
sources:
  - "apps/ttb-studio/src/lib/server/backend.ts"
---

# ttb-studio backend.ts (unused Python bridge)

## Overview

A loopback bridge helper to the Python TTB Studio prototype, reading `TTB_STUDIO_API_URL` (`apps/ttb-studio/src/lib/server/backend.ts:1-8`). Unchanged since `3997ab2`.

## Signature / Definition

```ts
export function upstreamUrl(path: string): string
export function upstreamUnavailable(error: unknown): Response
export function passthrough(upstream: Response): Response
```

## Behavior

- `upstreamUrl` defaults to `http://127.0.0.1:8002`, strips trailing slashes and rejects non-http(s) protocols (`apps/ttb-studio/src/lib/server/backend.ts:2-8`).
- `upstreamUnavailable` returns 503 JSON (`apps/ttb-studio/src/lib/server/backend.ts:9-18`); `passthrough` copies status and body with JSON and `no-store` headers (`apps/ttb-studio/src/lib/server/backend.ts:19-24`).
- > [!gap]
  > Still no importer at HEAD `b58d457`: a search of `apps/ttb-studio/src` for `server/backend` finds none, including the new `/api/studio/*` routes. See [[questions/is-ttb-studio-backend-ts-dead-code]].

## Connections

- **depends_on:** [[entities/env-ttb-studio-api-url]]
- **used_by:** no importer or caller found in source
- **related:** [[entities/mod-ttb-studio-python-app]], [[questions/is-ttb-studio-backend-ts-dead-code]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/backend.ts`
