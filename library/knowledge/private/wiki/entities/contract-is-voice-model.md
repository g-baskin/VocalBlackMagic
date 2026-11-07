---
type: entity
title: "isVoiceModel / isSafeModelFile"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/voice.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-voice]]"
  - "[[entities/contract-voice-model]]"
used_by:
  - "[[entities/mod-vf-forge]]"
  - "[[entities/mod-studio-voices]]"
  - "[[entities/mod-studio-derive]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - function
  - contract
  - voice
related:
  - "[[concepts/consent-record]]"
sources:
  - "packages/contracts/src/voice.ts"
---

# isVoiceModel / isSafeModelFile

## Overview

Runtime guards for registry JSON read from disk (`packages/contracts/src/voice.ts:29-57`).

## Signature / Definition

```ts
export function isVoiceModel(value: unknown): value is VoiceModel
export function isSafeModelFile(value: unknown): value is string
```

## Behavior

- `isVoiceModel` requires all fields, provider `replicate`, and `consent.own_voice === true` (`packages/contracts/src/voice.ts:33-47`).
- `isSafeModelFile` accepts only `<voice id>.model.zip` with no directory part, blocking path traversal (`packages/contracts/src/voice.ts:50-56`).
- Used at `apps/vocal-fix/src/lib/server/forge.ts:111`, `apps/vocal-fix/src/lib/server/forge.ts:122`, `apps/ttb-studio/src/lib/server/studio/voices.ts:30`, `apps/ttb-studio/src/lib/server/studio/derive.ts:116`.

## Connections

- **depends_on:** [[entities/mod-contracts-voice]], [[entities/contract-voice-model]]
- **used_by:** [[entities/mod-vf-forge]], [[entities/mod-studio-voices]], [[entities/mod-studio-derive]]
- **related:** [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/contracts/src/voice.ts`
