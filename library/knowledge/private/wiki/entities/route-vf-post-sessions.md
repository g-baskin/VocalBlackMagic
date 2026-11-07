---
type: entity
title: "Vocal Fix POST /api/sessions"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/api/sessions/+server.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-svc]]"
  - "[[entities/mod-vf-media]]"
  - "[[entities/mod-vf-service]]"
used_by:
  - "[[entities/route-vf-page]]"
last_commit_hash: "f88cc09"
tested_by: []
route_method: POST
route_path: "/api/sessions"
tags:
  - entity
  - function
  - vocal-fix
  - sveltekit-route
related:
  - "[[concepts/vocal-fix-mutation-guard]]"
  - "[[concepts/reference-session]]"
  - "[[concepts/consent-record]]"
sources:
  - "apps/vocal-fix/src/routes/api/sessions/+server.ts"
---

# Vocal Fix POST /api/sessions

## Overview

Creates a Vocal Fix session from one or five recordings (`apps/vocal-fix/src/routes/api/sessions/+server.ts:7-39`).

## Signature / Definition

```ts
export const POST: RequestHandler
```

## Behavior

- `guardMutation` with `json: false`: loopback host, development only, `x-vbm-intent` header (`apps/vocal-fix/src/routes/api/sessions/+server.ts:8-9`).
- Reads at most 5 x 100 MB + 1 MB, else 413 (`apps/vocal-fix/src/routes/api/sessions/+server.ts:10-11`); parses multipart, 400 on failure (`apps/vocal-fix/src/routes/api/sessions/+server.ts:12-19`); 422 if any `files` entry is not a file (`apps/vocal-fix/src/routes/api/sessions/+server.ts:20-21`).
- Passes mode, performer and `acknowledged_rights === "true"` to `intake` and returns the manifest with 201 (`apps/vocal-fix/src/routes/api/sessions/+server.ts:22-35`).

## Connections

- **depends_on:** [[entities/mod-vf-gate]], [[entities/mod-vf-errors]], [[entities/mod-vf-svc]], [[entities/mod-vf-media]], [[entities/mod-vf-service]]
- **used_by:** [[entities/route-vf-page]]
- **related:** [[concepts/vocal-fix-mutation-guard]], [[concepts/reference-session]], [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/routes/api/sessions/+server.ts`
