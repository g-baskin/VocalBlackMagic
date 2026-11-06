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
related:
  - "[[concepts/dev-only-generation-gate]]"
sources:
  - "apps/vocal-fix/src/routes/api/references/+server.ts"
  - "infra/systemd/vbm-vocal-fix.service"
---

# Production 403 guard

## Definition

Every route that stores, reads or deletes user audio, or spends provider credit, answers 403 unless `NODE_ENV` is `development`. Production systemd units set `NODE_ENV=production`, so those routes are closed in that deployment (`infra/systemd/vbm-vocal-fix.service:10`, `infra/systemd/vbm-ttb-studio.service:10`).

## How it works

- Vocal Fix: POST, GET and DELETE reference routes check `process.env.NODE_ENV` inline (`apps/vocal-fix/src/routes/api/references/+server.ts:7-13`, `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:7-8`, `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:27-28`).
- TTB Studio: through the shared gate helper (see [[concepts/dev-only-generation-gate]]).
- Health and capabilities routes are not guarded (`apps/vocal-fix/src/routes/api/capabilities/+server.ts:3-16`, `apps/ttb-studio/src/routes/api/health/+server.ts:3-10`).
- `assertAuthenticated` exists in `@vbm/auth` but no route calls it (`packages/auth/src/index.ts:11-15`; code graph shows no importer).

## Why it matters

Changing `NODE_ENV` to bypass the guard does not supply authentication. Real tenant-scoped auth is described in `library/knowledge/private/auth/session-and-tenancy-model.md`.

## Examples in this codebase

- [[entities/route-vf-post-references]]
- [[entities/route-vf-delete-reference]]

## Connections

- **involves entities:** [[entities/route-vf-post-references]], [[entities/route-vf-get-reference]], [[entities/route-vf-delete-reference]], [[entities/mod-music-gate]], [[entities/mod-auth]], [[entities/env-node-env]]
- **related concepts:** [[concepts/dev-only-generation-gate]]

## Sources

- `apps/vocal-fix/src/routes/api/references/+server.ts`
- `infra/systemd/vbm-vocal-fix.service`
