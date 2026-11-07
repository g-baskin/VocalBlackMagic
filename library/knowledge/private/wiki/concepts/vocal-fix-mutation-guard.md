---
type: concept
title: "Vocal Fix mutation guard"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "guardMutation"
  - "host guard"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/production-403-guard]]"
sources:
  - "apps/vocal-fix/src/lib/server/gate.ts"
  - "apps/vocal-fix/src/hooks.server.ts"
  - "apps/vocal-fix/src/lib/client.ts"
---

# Vocal Fix mutation guard

## Definition

Layered checks every Vocal Fix state-changing route runs: loopback Host, development-only, and a non-simple request (JSON or `x-vbm-intent`).

## How it works

- The server hook rejects non-loopback Host headers on all `/api/` paths (`apps/vocal-fix/src/hooks.server.ts:5-11`); `guardMutation` repeats it (`apps/vocal-fix/src/lib/server/gate.ts:33-35`).
- Then `disabledResponse` returns 403 outside development (`apps/vocal-fix/src/lib/server/gate.ts:6-12`, `apps/vocal-fix/src/lib/server/gate.ts:36-37`).
- Then JSON routes need `application/json` and others need `x-vbm-intent`, else 415, so cross-site simple forms are refused (`apps/vocal-fix/src/lib/server/gate.ts:21-26`, `apps/vocal-fix/src/lib/server/gate.ts:38-42`).
- The browser helper `api` sets one of these on every mutating call (`apps/vocal-fix/src/lib/client.ts:67-72`); the Codex revoke call does not (`apps/vocal-fix/src/routes/voices/+page.svelte:54`).

## Why it matters

It defends a local dev server against DNS rebinding and CSRF. It is not authentication: there is no user, tenant or ownership check, so any loopback client can read or delete any session by UUID.

## Examples in this codebase

- [[entities/mod-vf-gate]]
- [[entities/mod-vf-hooks-server]]

## Connections

- **involves entities:** [[entities/mod-vf-gate]], [[entities/mod-vf-hooks-server]], [[entities/mod-vf-client]], [[entities/route-vf-post-sessions]], [[entities/route-vf-delete-voices-voice-id]], [[entities/test-vf-server]]
- **related concepts:** [[concepts/production-403-guard]]

## Sources

- `apps/vocal-fix/src/lib/server/gate.ts`
- `apps/vocal-fix/src/hooks.server.ts`
- `apps/vocal-fix/src/lib/client.ts`
