---
type: entity
title: "VocalReferenceSession"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/route-vf-page]]"
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - data-model
  - contract
related:
  - "[[concepts/reference-session]]"
  - "[[entities/ep-vf-post-references]]"
sources:
  - "packages/contracts/src/index.ts"
---

# VocalReferenceSession

## Overview

Manifest shape of a reference session (`packages/contracts/src/index.ts:54-70`).

## Signature / Definition

```ts
interface UploadedRecording { index; original_name; stored_name; bytes; integrity_verified }
interface VocalReferenceSession { session_id; voice_owner; acknowledged_rights; created_at; status; gold_vocal_ready; recordings; note }
```

## Behavior

- Mirrors the manifest written by the Python endpoint (`apps/vocal_fix/app.py:122-131`); the TypeScript type is not checked against it at runtime (the page casts, `apps/vocal-fix/src/routes/+page.svelte:68`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/route-vf-page]]
- **related:** [[concepts/reference-session]], [[entities/ep-vf-post-references]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
