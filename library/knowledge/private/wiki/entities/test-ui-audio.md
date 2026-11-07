---
type: entity
title: "ui audio.test.ts (bun:test)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/audio.test.ts"
language: ts
depends_on:
  - "[[entities/mod-ui-audio]]"
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - test
related: []
sources:
  - "packages/ui/src/audio.test.ts"
---

# ui audio.test.ts (bun:test)

## Overview

Bun tests for [[entities/mod-ui-audio]].

## Signature / Definition

```ts
test suite
```

## Behavior

- detectPitch on a 440 Hz sine within 2% and silence unvoiced (`packages/ui/src/audio.test.ts:11-21`); peaks, spectrogram near 1 kHz, note names (`packages/ui/src/audio.test.ts:28-59`); voice-print helpers (`packages/ui/src/audio.test.ts:67-87`).
- Not run during this wiki pass.

## Connections

- **depends_on:** [[entities/mod-ui-audio]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/audio.test.ts`
