---
type: entity
title: "server.test.ts (Vocal Fix server tests)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/server.test.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-profile]]"
  - "[[entities/mod-vf-diagnose]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-forge]]"
  - "[[entities/mod-vf-gate]]"
  - "[[entities/mod-vf-media]]"
  - "[[entities/mod-vf-replicate]]"
  - "[[entities/mod-contracts]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - test
  - vocal-fix
  - test
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/lib/server/server.test.ts"
---

# server.test.ts (Vocal Fix server tests)

## Overview

Bun test suite for the Vocal Fix server modules (`apps/vocal-fix/src/lib/server/server.test.ts:1-612`).

## Signature / Definition

```ts
import { describe, expect, test } from 'bun:test'
```

## Behavior

- Storage traversal and delete (`apps/vocal-fix/src/lib/server/server.test.ts:47-77`); ffprobe validation including a part-corrupted file (`apps/vocal-fix/src/lib/server/server.test.ts:79-114`).
- Diagnosis, every preset chain renders, gold phrase ranking and silence-joined assembly (`apps/vocal-fix/src/lib/server/server.test.ts:116-217`).
- Consent name matching, registry shape and revoke, ZIP validity (`apps/vocal-fix/src/lib/server/server.test.ts:219-267`).
- Gate 403 outside dev and 415 for simple requests; mocked Replicate polling and foreign-host rejection (`apps/vocal-fix/src/lib/server/server.test.ts:269-316`); data URI and 429 retry regressions (`apps/vocal-fix/src/lib/server/server.test.ts:318-347`).
- Pitch profile, recorder formats, range responses, `readCapped`, host guard including the hook, job limits and restart, adaptive chain and gain cap (`apps/vocal-fix/src/lib/server/server.test.ts:349-612`).
- Uses a real ffmpeg; it does not exercise live Replicate calls or the Svelte pages.

## Connections

- **depends_on:** [[entities/mod-vf-profile]], [[entities/mod-vf-diagnose]], [[entities/mod-vf-errors]], [[entities/mod-vf-forge]], [[entities/mod-vf-gate]], [[entities/mod-vf-media]], [[entities/mod-vf-replicate]], [[entities/mod-contracts]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/server.test.ts`
