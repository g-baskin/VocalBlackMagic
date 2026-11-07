---
type: entity
title: "VoiceModel / VoiceConsent"
entity_type: data-model
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/voice.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-voice]]"
used_by:
  - "[[entities/mod-vf-forge]]"
  - "[[entities/mod-studio-voices]]"
  - "[[entities/mod-studio-gold]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/mod-studio-derive]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - data-model
  - contract
  - voice
related:
  - "[[entities/contract-is-voice-model]]"
  - "[[concepts/consent-record]]"
sources:
  - "packages/contracts/src/voice.ts"
---

# VoiceModel / VoiceConsent

## Overview

A forged voice and its consent attestation (`packages/contracts/src/voice.ts:2-24`).

## Signature / Definition

```ts
type VoiceModelStatus = 'training'|'ready'|'failed'
interface VoiceConsent { own_voice: true; attested_name; statement; attested_at; session_id }
interface VoiceModel { id; performer; status; created_at; consent; provider: 'replicate'; model_url; model_file?; profile?; error? }
```

## Behavior

- `own_voice` is the literal `true`, so a record cannot type-check without the own-voice attestation (`packages/contracts/src/voice.ts:4-10`).
- `model_file` is a local archive basename because `model_url` expires (`packages/contracts/src/voice.ts:20-21`). Ids match `voice-<uuid>` (`packages/contracts/src/voice.ts:26-27`).

## Connections

- **depends_on:** [[entities/mod-contracts-voice]]
- **used_by:** [[entities/mod-vf-forge]], [[entities/mod-studio-voices]], [[entities/mod-studio-gold]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-derive]]
- **related:** [[entities/contract-is-voice-model]], [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/contracts/src/voice.ts`
