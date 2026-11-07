---
type: concept
title: "Production 403 guard"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "fail-closed guard"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/vocal-fix-mutation-guard]]"
sources:
  - "apps/vocal-fix/src/lib/server/gate.ts"
  - "apps/vocal-fix/src/routes/api/references/+server.ts"
  - "infra/systemd/vbm-vocal-fix.service"
---

# Production 403 guard

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior: Vocal Fix guarded only the three reference routes inline. Now: all pipeline routes use `gate.ts`, plus a loopback host hook.

## Definition

Every route that stores, reads or deletes user audio, or spends provider credit, answers 403 unless `NODE_ENV` is `development`. Production systemd units set `NODE_ENV=production` (`infra/systemd/vbm-vocal-fix.service:10`, `infra/systemd/vbm-ttb-studio.service:10`).

## How it works

- Vocal Fix pipeline routes call `disabledResponse` or `guardMutation` from `gate.ts` (`apps/vocal-fix/src/lib/server/gate.ts:1-12`, `apps/vocal-fix/src/lib/server/gate.ts:33-44`).
- Legacy reference routes still check `process.env.NODE_ENV` inline (`apps/vocal-fix/src/routes/api/references/+server.ts:7-13`, `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:7-8`).
- Health and capabilities have no dev gate, but the `/api/` hook requires a loopback Host (`apps/vocal-fix/src/hooks.server.ts:6-9`); capabilities reports `processing_allowed` (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:13-14`).
- TTB Studio: through its own gate helper (see [[concepts/dev-only-generation-gate]]).
- `assertAuthenticated` exists in `@vbm/auth` but no route calls it (`packages/auth/src/index.ts:11-15`).

## Why it matters

Changing `NODE_ENV` to bypass the guard does not supply authentication.

## Examples in this codebase

- [[entities/mod-vf-gate]]
- [[entities/route-vf-post-references]]

## Prior description (stale)

> [!stale]
> Superseded at commit `f88cc09` (2026-11-06). Reason: Vocal Fix pipeline added in SvelteKit.

- Vocal Fix: only POST, GET and DELETE reference routes checked `NODE_ENV` inline; capabilities was an unguarded proxy.

## Connections

- **involves entities:** [[entities/mod-vf-gate]], [[entities/mod-vf-hooks-server]], [[entities/route-vf-post-references]], [[entities/route-vf-get-reference]], [[entities/route-vf-delete-reference]], [[entities/mod-music-gate]], [[entities/mod-auth]], [[entities/env-node-env]]
- **related concepts:** [[concepts/dev-only-generation-gate]], [[concepts/vocal-fix-mutation-guard]]

## Sources

- `apps/vocal-fix/src/lib/server/gate.ts`
- `apps/vocal-fix/src/routes/api/references/+server.ts`
- `infra/systemd/vbm-vocal-fix.service`
