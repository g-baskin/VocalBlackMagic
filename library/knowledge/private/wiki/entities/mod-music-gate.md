---
type: entity
title: "music/gate.ts (generation gate helpers)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/gate.ts"
language: ts
depends_on:
  - "[[entities/env-node-env]]"
used_by:
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
  - "[[entities/route-ttb-get-generation-audio]]"
  - "[[entities/test-music]]"
  - "[[entities/mod-studio-context]]"
  - "[[entities/route-ttb-get-studio-capabilities]]"
  - "[[entities/route-ttb-studio-seances-deps]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-music]]"
tags:
  - entity
  - module
  - ttb-studio
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/production-403-guard]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/gate.ts"
---

# music/gate.ts (generation gate helpers)

## Overview

Server helpers that decide whether hosted generation may run and whether a request may spend credit. Generation is allowed only when `NODE_ENV` equals `development` (`apps/ttb-studio/src/lib/server/music/gate.ts:1-4`).

## Signature / Definition

```ts
export function generationAllowed(): boolean
export function generationDisabledResponse(): Response | null
export function configuredKey(value: string | undefined): string | null
export function isJsonRequest(request: Request): boolean
```

## Behavior

- `generationAllowed` returns `process.env.NODE_ENV === 'development'` (`apps/ttb-studio/src/lib/server/music/gate.ts:3`).
- `generationDisabledResponse` returns null when allowed, otherwise a 403 JSON response with a `detail` message (`apps/ttb-studio/src/lib/server/music/gate.ts:6-12`).
- `configuredKey` trims a key and maps empty or missing values to null (`apps/ttb-studio/src/lib/server/music/gate.ts:14-17`).
- `isJsonRequest` accepts only a `content-type` whose media type is exactly `application/json`, so form or text/plain cross-site POSTs cannot start paid work (`apps/ttb-studio/src/lib/server/music/gate.ts:19-25`).

- Reused by the studio `guard` (`apps/ttb-studio/src/lib/server/studio/context.ts:13`, `apps/ttb-studio/src/lib/server/studio/context.ts:51-60`), `/api/studio/capabilities` (`apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:3`) and the séance wiring (`apps/ttb-studio/src/routes/api/studio/seances/_deps.ts:1`). Module unchanged since `29c84e4`.

## Connections

- **depends_on:** [[entities/env-node-env]]
- **used_by:** [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/test-music]], [[entities/mod-studio-context]], [[entities/route-ttb-get-studio-capabilities]], [[entities/route-ttb-studio-seances-deps]]
- **related:** [[concepts/dev-only-generation-gate]], [[concepts/production-403-guard]]

## Tested by

- [[entities/test-music]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/gate.ts`
