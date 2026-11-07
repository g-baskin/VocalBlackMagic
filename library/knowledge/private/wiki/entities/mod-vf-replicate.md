---
type: entity
title: "lib/server/replicate.ts (Replicate client)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/replicate.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-errors]]"
  - "[[entities/ext-api-replicate-com]]"
  - "[[entities/ext-replicate-delivery]]"
used_by:
  - "[[entities/mod-vf-service]]"
  - "[[entities/route-vf-get-capabilities]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - provider
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/lib/server/replicate.ts"
---

# lib/server/replicate.ts (Replicate client)

## Overview

Hosted inference client used for paid stages (`apps/vocal-fix/src/lib/server/replicate.ts:1-211`).

## Signature / Definition

```ts
export const MODELS; export function isAllowedOutputUrl(raw): boolean
export class ReplicateClient { uploadFile; create; get; cancel; wait; download }
export function outputUrl(output, field?): string | null; export function decodeDataUri(uri, maxBytes): Uint8Array
```

## Behavior

- Pins three model versions with cost estimates: Demucs, resemble-enhance and RVC training (`apps/vocal-fix/src/lib/server/replicate.ts:5-22`).
- Token sent only as a Bearer header (`apps/vocal-fix/src/lib/server/replicate.ts:52-54`); non-OK responses become 502 (`apps/vocal-fix/src/lib/server/replicate.ts:56-62`).
- `create` retries 429 up to six times, waiting 1 to 30 s (`apps/vocal-fix/src/lib/server/replicate.ts:84-108`); `get` and `cancel` validate the prediction id (`apps/vocal-fix/src/lib/server/replicate.ts:110-125`).
- `wait` polls, cancels remotely on abort or timeout (default 15 min) and fails unless `succeeded` (`apps/vocal-fix/src/lib/server/replicate.ts:127-158`).
- `download` accepts base64 `data:audio/` URIs or https `replicate.delivery` hosts only, forbids redirects and enforces size bounds (`apps/vocal-fix/src/lib/server/replicate.ts:33-43`, `apps/vocal-fix/src/lib/server/replicate.ts:160-171`, `apps/vocal-fix/src/lib/server/replicate.ts:200-211`).

## Connections

- **depends_on:** [[entities/mod-vf-errors]], [[entities/ext-api-replicate-com]], [[entities/ext-replicate-delivery]]
- **used_by:** [[entities/mod-vf-service]], [[entities/route-vf-get-capabilities]]
- **related:** [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/replicate.ts`
