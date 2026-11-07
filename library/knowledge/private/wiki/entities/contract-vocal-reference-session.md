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
used_by: []
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - data-model
  - contract
related:
  - "[[concepts/reference-session]]"
  - "[[entities/ep-vf-post-references]]"
  - "[[questions/contracts-legacy-generation-contracts]]"
sources:
  - "packages/contracts/src/index.ts"
---

# VocalReferenceSession

> [!contradiction]
> Updated in place at HEAD `b58d457` (wiki previously built at `29c84e4`).
> Prior contract: used_by [[entities/route-vf-page]] (cast at `apps/vocal-fix/src/routes/+page.svelte:68`).
> New contract: no importer; the Vocal Fix page was rewritten in commit `f88cc09` and its sessions now use the SvelteKit pipeline (see mod-vf-* pages).

## Overview

Manifest shape of a legacy Python reference session (`packages/contracts/src/index.ts:54-70`).

## Signature / Definition

```ts
interface UploadedRecording { index; original_name; stored_name; bytes; integrity_verified }
interface VocalReferenceSession { session_id; voice_owner; acknowledged_rights; created_at; status; gold_vocal_ready; recordings; note }
```

## Behavior

- Mirrors the manifest written by the Python endpoint (`apps/vocal_fix/app.py:122-131`); nothing checks it at runtime.
- No importer in `apps/*/src` at HEAD (grep for `VocalReferenceSession`); only stale build output under `apps/vocal-fix/build` still references it.

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/reference-session]], [[entities/ep-vf-post-references]], [[questions/contracts-legacy-generation-contracts]]

## Tested by

- No test found in the repository for this entity.

## Prior claims

> [!stale]
> Superseded at HEAD `b58d457` (change landed in commit `f88cc09`, 2026-11-06); see the [!contradiction] callout above.
> Prior claim (wiki built at `29c84e4`): The TypeScript type is not checked at runtime (the page casts, `apps/vocal-fix/src/routes/+page.svelte:68`); used_by [[entities/route-vf-page]].

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
