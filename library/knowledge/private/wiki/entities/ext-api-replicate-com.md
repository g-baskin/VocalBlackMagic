---
type: entity
title: "api.replicate.com"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/replicate.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-vf-replicate]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "api"
related:
  - "[[entities/env-replicate-api-token]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/replicate.ts"
  - "apps/vocal-fix/src/lib/server/replicate.ts"
---

# api.replicate.com

## Overview

Replicate predictions and files API used by both apps (`apps/ttb-studio/src/lib/server/studio/replicate.ts:4`, `apps/vocal-fix/src/lib/server/replicate.ts:3`).

## Signature / Definition

```text
https://api.replicate.com
```

## Behavior

- Kind: Real API call target: the server sends requests to this host.
- Caller: TTB Studio: `apps/ttb-studio/src/lib/server/studio/replicate.ts:107`, `:131`, `:141`, `:159`
- Caller: Vocal Fix: `apps/vocal-fix/src/lib/server/replicate.ts:73`, `:91`, `:112`, `:121`

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-studio-replicate]], [[entities/mod-vf-replicate]]
- **related:** [[entities/env-replicate-api-token]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/replicate.ts`
- `apps/vocal-fix/src/lib/server/replicate.ts`
