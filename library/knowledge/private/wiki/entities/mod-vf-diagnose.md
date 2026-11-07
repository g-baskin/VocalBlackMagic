---
type: entity
title: "lib/server/diagnose.ts (take diagnosis)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/diagnose.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-media]]"
used_by:
  - "[[entities/mod-vf-service]]"
  - "[[entities/mod-vf-chain]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - audio
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/lib/server/diagnose.ts"
---

# lib/server/diagnose.ts (take diagnosis)

## Overview

Measures loudness, noise, clipping and silence of a take (`apps/vocal-fix/src/lib/server/diagnose.ts:1-250`).

## Signature / Definition

```ts
export function parseEbur128(stderr): Loudness; export function parseAstats(stderr): Stats
export function parseSilences(stderr, duration): { start; end }[]
export function frameStats(pcm, rate): FrameStats
export function buildDiagnosis(duration, loudness, stats, frames, silences, now): Diagnosis
export const SILENCE_FILTER; export async function diagnoseFile(path, duration, now, signal?): Promise<Diagnosis>
```

## Behavior

- Parsers for ebur128, astats and silencedetect output (`apps/vocal-fix/src/lib/server/diagnose.ts:55`, `apps/vocal-fix/src/lib/server/diagnose.ts:64`, `apps/vocal-fix/src/lib/server/diagnose.ts:79`); `frameStats` derives noise floor percentiles and clipped runs from PCM (`apps/vocal-fix/src/lib/server/diagnose.ts:95-96`).
- `buildDiagnosis` combines them into scores and findings (`apps/vocal-fix/src/lib/server/diagnose.ts:146`).
- `diagnoseFile` runs the three analyses plus a 44.1 kHz decode in parallel (`apps/vocal-fix/src/lib/server/diagnose.ts:228-250`).

## Connections

- **depends_on:** [[entities/mod-vf-media]]
- **used_by:** [[entities/mod-vf-service]], [[entities/mod-vf-chain]]
- **related:** [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/diagnose.ts`
