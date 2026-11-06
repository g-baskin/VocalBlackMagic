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
sources:
  - "apps/ttb-studio/src/lib/server/music/gate.ts"
---

# Dev-only generation gate

## Definition

Hosted song generation in TTB Studio runs only when `NODE_ENV` is `development`, because there is no user identity, tenant scoping or spending cap yet (`apps/ttb-studio/src/lib/server/music/gate.ts:1-4`).

## How it works

- `generationDisabledResponse` returns 403 outside development (`apps/ttb-studio/src/lib/server/music/gate.ts:6-12`) and is called first by the POST, poll and audio routes (`apps/ttb-studio/src/routes/api/generations/+server.ts:23-24`, `apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:10-11`, `apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:10-11`).
- The capabilities route is not gated; it reports `disabled outside development` instead (`apps/ttb-studio/src/lib/server/music/capabilities.ts:11-12`).
- Paid POSTs must also be `application/json` (`apps/ttb-studio/src/lib/server/music/gate.ts:19-25`).

## Why it matters

Setting `NODE_ENV=development` in a reachable deployment would open paid provider spending to anyone; the gate is a temporary substitute for authentication, not a security control in itself. See `library/knowledge/private/security/trust-boundaries.md`.

## Examples in this codebase

- [[entities/mod-music-gate]] defines the switch
- [[entities/route-ttb-post-generations]] enforces it before spending

## Connections

- **involves entities:** [[entities/mod-music-gate]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/route-ttb-get-capabilities]], [[entities/env-node-env]]
- **related concepts:** [[concepts/production-403-guard]], [[concepts/hosted-generation-flow]]

## Sources

- `apps/ttb-studio/src/lib/server/music/gate.ts`
