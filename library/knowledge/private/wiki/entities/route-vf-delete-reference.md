---
type: entity
title: "Vocal Fix DELETE /api/references/[session_id]"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vocal-fix-backend]]"
  - "[[entities/ep-vf-delete-reference]]"
  - "[[entities/env-vocal-fix-api-url]]"
  - "[[entities/env-node-env]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: DELETE
route_path: "/api/references/[session_id]"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/production-403-guard]]"
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts"
---

# Vocal Fix DELETE /api/references/[session_id]

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior contract: no intent header; called by [[entities/route-vf-page]]. New contract: 415 without `x-vbm-intent` (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:29-30`); no caller; superseded by [[entities/route-vf-delete-sessions-id]].

## Overview

Legacy proxy delete of a Python reference session (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:26-47`).

## Signature / Definition

```ts
export const DELETE: RequestHandler
```

## Behavior

- 403 unless development (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:27-28`); 415 without `x-vbm-intent` (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:29-30`); 404 for a non-UUID id (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:31-32`).
- Proxies a DELETE without a timeout (`apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:33-46`). No caller in the app; see [[questions/vocal-fix-legacy-reference-routes]].

## Prior behavior (stale)

> [!stale]
> Behavior changed in commit `f88cc09` (2026-11-06). Reason: intent header added; the page no longer deletes reference sessions.

- 404 check cited at lines 29-30 and proxy at 31-41 at `3997ab2`.
- used_by [[entities/route-vf-page]].

## Connections

- **depends_on:** [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-delete-reference]], [[entities/env-vocal-fix-api-url]], [[entities/env-node-env]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/production-403-guard]], [[concepts/reference-session]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts`
