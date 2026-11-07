---
type: entity
title: "lib/server/gate.ts (dev gate, intent and host guards)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/gate.ts"
language: ts
depends_on:
  - "[[entities/env-node-env]]"
used_by:
  - "[[entities/mod-vf-hooks-server]]"
  - "[[entities/route-vf-get-capabilities]]"
  - "[[entities/route-vf-post-sessions]]"
  - "[[entities/route-vf-get-sessions-id]]"
  - "[[entities/route-vf-delete-sessions-id]]"
  - "[[entities/route-vf-get-sessions-id-audio-area-file]]"
  - "[[entities/route-vf-post-sessions-id-diagnose]]"
  - "[[entities/route-vf-post-sessions-id-forge]]"
  - "[[entities/route-vf-post-sessions-id-gold]]"
  - "[[entities/route-vf-get-sessions-id-jobs-job]]"
  - "[[entities/route-vf-delete-sessions-id-jobs-job]]"
  - "[[entities/route-vf-post-sessions-id-repair]]"
  - "[[entities/route-vf-get-voices]]"
  - "[[entities/route-vf-delete-voices-voice-id]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - security
related:
  - "[[concepts/vocal-fix-mutation-guard]]"
  - "[[concepts/production-403-guard]]"
sources:
  - "apps/vocal-fix/src/lib/server/gate.ts"
---

# lib/server/gate.ts (dev gate, intent and host guards)

## Overview

Request gates shared by every Vocal Fix API route (`apps/vocal-fix/src/lib/server/gate.ts:1-96`).

## Signature / Definition

```ts
export function processingAllowed(): boolean
export function disabledResponse(): Response | null
export function guardMutation(request: Request, opts: { json: boolean }): Response | null
export async function readJson(request: Request): Promise<Record<string, unknown> | null>
export async function readCapped(request: Request, maxBytes: number): Promise<Uint8Array | null>
export function isLocalHost(host: string | null): boolean
export function hostGuard(request: Request): Response | null
```

## Behavior

- `processingAllowed` is true only when `NODE_ENV === "development"`; `disabledResponse` otherwise returns 403 "disabled pending authentication, tenancy and billing" (`apps/vocal-fix/src/lib/server/gate.ts:1-12`).
- `guardMutation` runs `hostGuard`, then the dev gate, then requires `application/json` (json routes) or a non-empty `x-vbm-intent` header (others), else 415 (`apps/vocal-fix/src/lib/server/gate.ts:21-44`).
- `readJson` returns null unless the body is a JSON object (`apps/vocal-fix/src/lib/server/gate.ts:46-55`); `readCapped` rejects a declared or streamed body above the byte cap (`apps/vocal-fix/src/lib/server/gate.ts:57-82`).
- `isLocalHost` accepts only `localhost`, `127.0.0.1` and `[::1]` on any port (`apps/vocal-fix/src/lib/server/gate.ts:84-90`); `hostGuard` answers 403 otherwise (`apps/vocal-fix/src/lib/server/gate.ts:92-96`).
- No user identity, tenant or ownership check exists here; the comment says so (`apps/vocal-fix/src/lib/server/gate.ts:2`).

## Connections

- **depends_on:** [[entities/env-node-env]]
- **used_by:** [[entities/mod-vf-hooks-server]], [[entities/route-vf-get-capabilities]], [[entities/route-vf-post-sessions]], [[entities/route-vf-get-sessions-id]], [[entities/route-vf-delete-sessions-id]], [[entities/route-vf-get-sessions-id-audio-area-file]], [[entities/route-vf-post-sessions-id-diagnose]], [[entities/route-vf-post-sessions-id-forge]], [[entities/route-vf-post-sessions-id-gold]], [[entities/route-vf-get-sessions-id-jobs-job]], [[entities/route-vf-delete-sessions-id-jobs-job]], [[entities/route-vf-post-sessions-id-repair]], [[entities/route-vf-get-voices]], [[entities/route-vf-delete-voices-voice-id]]
- **related:** [[concepts/vocal-fix-mutation-guard]], [[concepts/production-403-guard]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/gate.ts`
