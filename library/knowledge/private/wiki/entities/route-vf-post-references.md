---
type: entity
title: "Vocal Fix POST /api/references"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/references/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vocal-fix-backend]]"
  - "[[entities/ep-vf-post-references]]"
  - "[[entities/env-vocal-fix-api-url]]"
  - "[[entities/env-node-env]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
route_method: POST
route_path: "/api/references"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/production-403-guard]]"
  - "[[concepts/reference-session]]"
  - "[[concepts/consent-record]]"
sources:
  - "apps/vocal-fix/src/routes/api/references/+server.ts"
---

# Vocal Fix POST /api/references

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior contract: no intent header; called by [[entities/route-vf-page]]. New contract: 415 without `x-vbm-intent` (`apps/vocal-fix/src/routes/api/references/+server.ts:14-16`) and no caller in the app; superseded in the UI by [[entities/route-vf-post-sessions]].

## Overview

Legacy proxy upload to the Python prototype (`apps/vocal-fix/src/routes/api/references/+server.ts:5-54`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- 403 unless `NODE_ENV` is `development` (`apps/vocal-fix/src/routes/api/references/+server.ts:6-13`); 415 without `x-vbm-intent` (`apps/vocal-fix/src/routes/api/references/+server.ts:14-16`); 400 on bad multipart (`apps/vocal-fix/src/routes/api/references/+server.ts:17-22`).
- Requires exactly five `files` (`apps/vocal-fix/src/routes/api/references/+server.ts:23-26`), `acknowledged_rights` equal to `true` (403, `apps/vocal-fix/src/routes/api/references/+server.ts:27-31`), a non-blank `voice_owner` (`apps/vocal-fix/src/routes/api/references/+server.ts:32-33`) and each file 1 byte to 25 MiB with a WAV/MP3/FLAC/M4A name (`apps/vocal-fix/src/routes/api/references/+server.ts:3-4`, `apps/vocal-fix/src/routes/api/references/+server.ts:34-40`).
- Forwards to the Python prototype with a 60 s timeout (`apps/vocal-fix/src/routes/api/references/+server.ts:41-53`).
- No page in `apps/vocal-fix/src` calls it any more; the home page posts to `/api/sessions` (`apps/vocal-fix/src/routes/+page.svelte:77`). See [[questions/vocal-fix-legacy-reference-routes]].

## Prior behavior (stale)

> [!stale]
> Behavior changed in commit `f88cc09` (2026-11-06). Reason: intent header added and the page switched to `/api/sessions`.

- Validation lines cited as 20-37 and forward as 38-50 at `3997ab2`; no intent-header check.
- used_by [[entities/route-vf-page]].

## Connections

- **depends_on:** [[entities/mod-vocal-fix-backend]], [[entities/ep-vf-post-references]], [[entities/env-vocal-fix-api-url]], [[entities/env-node-env]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/production-403-guard]], [[concepts/reference-session]], [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `42cd7f7` ("Add two SvelteKit 3 Bun app skeletons and protected local audio API bridges") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/references/+server.ts`
