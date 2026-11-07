---
type: entity
title: "contracts voice.ts (shared voice registry)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/voice.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/mod-contracts]]"
  - "[[entities/mod-vf-forge]]"
  - "[[entities/mod-studio-voices]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-gold]]"
  - "[[entities/mod-studio-voicesummon]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - contract
  - voice
related:
  - "[[entities/contract-voice-model]]"
  - "[[entities/contract-is-voice-model]]"
  - "[[concepts/consent-record]]"
sources:
  - "packages/contracts/src/voice.ts"
---

# contracts voice.ts (shared voice registry)

## Overview

Voice registry entry at `<data dir>/shared/voices/<id>.json`, written by Vocal Fix and read by TTB Studio (`packages/contracts/src/voice.ts:1`).

## Signature / Definition

```ts
export type VoiceModelStatus
export interface VoiceConsent, VoiceModel
export const voiceIdPattern
export function isVoiceModel(value: unknown): value is VoiceModel
export function isSafeModelFile(value: unknown): value is string
```

## Behavior

- Writer side: `apps/vocal-fix/src/lib/server/forge.ts:4`, `apps/vocal-fix/src/lib/server/forge.ts:111`; reader side: `apps/ttb-studio/src/lib/server/studio/voices.ts:30`, `apps/ttb-studio/src/lib/server/studio/derive.ts:116`.
- Atomic pages: [[entities/contract-voice-model]], [[entities/contract-is-voice-model]].

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/mod-contracts]], [[entities/mod-vf-forge]], [[entities/mod-studio-voices]], [[entities/mod-studio-derive]], [[entities/mod-studio-gold]], [[entities/mod-studio-voicesummon]]
- **related:** [[entities/contract-voice-model]], [[entities/contract-is-voice-model]], [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/contracts/src/voice.ts`
