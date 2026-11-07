---
type: concept
title: "Dev-only generation gate"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "NODE_ENV development gate"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/production-403-guard]]"
  - "[[concepts/hosted-generation-flow]]"
  - "[[concepts/ttb-studio-api-surface]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/gate.ts"
  - "apps/ttb-studio/src/lib/server/studio/context.ts"
---

# Dev-only generation gate

## Definition

Hosted song generation in TTB Studio runs only when `NODE_ENV` is `development`, because there is no user identity, tenant scoping or spending cap yet (`apps/ttb-studio/src/lib/server/music/gate.ts:1-4`).

## How it works

- `generationDisabledResponse` returns 403 outside development (`apps/ttb-studio/src/lib/server/music/gate.ts:6-12`) and is called first by the legacy POST, poll and audio routes (`apps/ttb-studio/src/routes/api/generations/+server.ts:23-24`, `apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:10-11`, `apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:10-11`).
- Since `f88cc09` every `/api/studio/*` handler except capabilities calls `guard`, which adds a DNS-rebinding check (403 unless the Host is localhost or 127.0.0.1) and, for writes, the JSON-only 415 (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- Both capabilities routes are ungated and report `allowed`/status instead (`apps/ttb-studio/src/lib/server/music/capabilities.ts:11-16`, `apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:11-14`).
- The legacy routes do not apply the localhost check; they rely only on the NODE_ENV gate and `isJsonRequest` (`apps/ttb-studio/src/routes/api/generations/+server.ts:23-26`).

## Why it matters

Setting `NODE_ENV=development` on a reachable host would open paid provider spending; the localhost check narrows this for studio routes but not for the legacy family. The gate substitutes for authentication; it is not a security control in itself. See `library/knowledge/private/security/trust-boundaries.md`.

## Examples in this codebase

- [[entities/mod-music-gate]]
- [[entities/mod-studio-context]]
- [[entities/route-ttb-post-generations]]

## Connections

- **involves entities:** [[entities/mod-music-gate]], [[entities/mod-studio-context]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/route-ttb-get-capabilities]], [[entities/route-ttb-get-studio-capabilities]], [[entities/env-node-env]]
- **related concepts:** [[concepts/production-403-guard]], [[concepts/hosted-generation-flow]], [[concepts/ttb-studio-api-surface]]

## Sources

- `apps/ttb-studio/src/lib/server/music/gate.ts`
- `apps/ttb-studio/src/lib/server/studio/context.ts`
