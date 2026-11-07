---
type: entity
title: "lib/server/service.ts (VocalFixService)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/service.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-chain]]"
  - "[[entities/mod-vf-diagnose]]"
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-vf-forge]]"
  - "[[entities/mod-vf-gold]]"
  - "[[entities/mod-vf-jobs]]"
  - "[[entities/mod-vf-media]]"
  - "[[entities/mod-vf-profile]]"
  - "[[entities/mod-vf-replicate]]"
  - "[[entities/mod-vf-storage]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/mod-contracts-voice]]"
used_by:
  - "[[entities/mod-vf-context]]"
  - "[[entities/route-vf-get-capabilities]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - orchestration
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
  - "[[concepts/gold-vocal]]"
  - "[[concepts/vocal-fix-voice-forge]]"
  - "[[concepts/consent-record]]"
sources:
  - "apps/vocal-fix/src/lib/server/service.ts"
---

# lib/server/service.ts (VocalFixService)

## Overview

Orchestrates intake, diagnosis, repair, Gold Vocal and voice forge (`apps/vocal-fix/src/lib/server/service.ts:1-800`).

## Signature / Definition

```ts
export const RIGHTS_STATEMENT
export class VocalFixService {
  intake(input); remove(id); diagnose(id); startRepair(id, body); gold(id, body);
  startForge(id, body); revokeVoice(voiceId); hostedReady()
}
```

## Behavior

- Hosted stages need a token, else 503 (`apps/vocal-fix/src/lib/server/service.ts:91-103`).
- `intake` requires mode fix or forge, `acknowledged_rights === true` (403), a 2-120 character performer, exactly 1 or 5 files, an allowed extension, 1 KB to 100 MB each; it stores originals with `wx`, verifies each with `probeAndVerify`, sets `integrity_verified: true`, records the rights statement in consent and audit, and deletes the session on any failure (`apps/vocal-fix/src/lib/server/service.ts:105-180`).
- `remove` cancels and waits for jobs, deletes job records and linked voice files, then the session (`apps/vocal-fix/src/lib/server/service.ts:182-189`).
- `startRepair` runs optional Demucs isolate and resemble-enhance, then a two-pass local polish with one stronger retry kept only if it regresses less, saving new derived versions; originals are not modified (`apps/vocal-fix/src/lib/server/service.ts:281-528`).
- `gold` needs a forge session with a repair for every take, then ranks, selects and assembles phrases, writes a sidecar with source hashes, and stores gold and profile (`apps/vocal-fix/src/lib/server/service.ts:530-626`).
- `startForge` validates consent, needs a gold, records a `voice_consent` audit event and a training voice, then builds a dataset ZIP, trains RVC on Replicate and seals the model (`apps/vocal-fix/src/lib/server/service.ts:628-778`).
- `revokeVoice` deletes voice files and appends `voice_revoked` to the source session (`apps/vocal-fix/src/lib/server/service.ts:780-799`).

## Connections

- **depends_on:** [[entities/mod-vf-chain]], [[entities/mod-vf-diagnose]], [[entities/mod-vf-errors]], [[entities/mod-vf-forge]], [[entities/mod-vf-gold]], [[entities/mod-vf-jobs]], [[entities/mod-vf-media]], [[entities/mod-vf-profile]], [[entities/mod-vf-replicate]], [[entities/mod-vf-storage]], [[entities/mod-contracts]], [[entities/mod-contracts-voice]]
- **used_by:** [[entities/mod-vf-context]], [[entities/route-vf-get-capabilities]]
- **related:** [[concepts/vocal-fix-repair-pipeline]], [[concepts/gold-vocal]], [[concepts/vocal-fix-voice-forge]], [[concepts/consent-record]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/service.ts`
