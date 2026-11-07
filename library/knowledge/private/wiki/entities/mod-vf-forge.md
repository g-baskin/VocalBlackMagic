---
type: entity
title: "lib/server/forge.ts (consent, ZIP, voice registry)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/forge.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-errors]]"
  - "[[entities/mod-contracts]]"
  - "[[entities/mod-contracts-voice]]"
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
  - security
  - consent
related:
  - "[[concepts/consent-record]]"
  - "[[concepts/vocal-fix-voice-forge]]"
sources:
  - "apps/vocal-fix/src/lib/server/forge.ts"
---

# lib/server/forge.ts (consent, ZIP, voice registry)

## Overview

Own-voice consent gate and shared voice registry (`apps/vocal-fix/src/lib/server/forge.ts:1-159`).

## Signature / Definition

```ts
export const CONSENT_STATEMENT
export function validateConsent(input: ConsentInput, performer: string): { attested_name; statement }
export function crc32(bytes); export function buildZip(entries): Uint8Array
export class VoiceRegistry { static newId(); path(id); write(voice); read(id); list(); remove(id) }
export function datasetEntryName(i: number): string
```

## Behavior

- `validateConsent` requires `own_voice === true`, a typed name that matches the session performer after NFKC, trim and case folding, and the exact `CONSENT_STATEMENT` if a statement is sent; each failure is 403 (`apps/vocal-fix/src/lib/server/forge.ts:7-31`).
- `buildZip` writes a stored ZIP and rejects entry names with `..` or other characters (`apps/vocal-fix/src/lib/server/forge.ts:45-90`).
- `VoiceRegistry` stores `<data>/shared/voices/<id>.json`, validates ids with `voiceIdPattern`, path-contains them, and checks `isVoiceModel` on write and read (`apps/vocal-fix/src/lib/server/forge.ts:92-127`).
- `remove` deletes only that voice's JSON and `.model.zip` (`apps/vocal-fix/src/lib/server/forge.ts:149-154`).
- Name matching proves only that the typed text equals the stored performer string; it does not verify identity.

## Connections

- **depends_on:** [[entities/mod-vf-errors]], [[entities/mod-contracts]], [[entities/mod-contracts-voice]]
- **used_by:** [[entities/mod-vf-service]], [[entities/route-vf-get-capabilities]]
- **related:** [[concepts/consent-record]], [[concepts/vocal-fix-voice-forge]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/forge.ts`
