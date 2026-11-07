---
type: entity
title: "lib/server/chain.ts (polish presets and guard)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/chain.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-diagnose]]"
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
  - audio
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/lib/server/chain.ts"
---

# lib/server/chain.ts (polish presets and guard)

## Overview

Local ffmpeg polish definitions and the never-worse comparison (`apps/vocal-fix/src/lib/server/chain.ts:1-187`).

## Signature / Definition

```ts
export const presets: Record<PresetId, Preset>; export function isPresetId(v): v is PresetId
export function buildPolishChain(id, diagnosis?, strength?): string
export function loudnessGainDb(measuredLufs, id, strength?): number
export function gainArgs(input, output, gainDb): string[]; export function polishArgs(input, output, chain): string[]
export function regressions(before, after): GuardedScore[]; export function regressionFinding(k): string
```

## Behavior

- Four presets: natural, radio, ethereal, grit, each with filter settings and a target LUFS (`apps/vocal-fix/src/lib/server/chain.ts:3-81`).
- `buildPolishChain` adds `adeclip` only when clipping was diagnosed, scales `afftdn` and adds a gate from the noise floor, and strengthens for retry strength 1 (`apps/vocal-fix/src/lib/server/chain.ts:92-137`).
- `loudnessGainDb` caps make-up gain at 12 dB, or 6 dB on the stronger pass (`apps/vocal-fix/src/lib/server/chain.ts:87-88`, `apps/vocal-fix/src/lib/server/chain.ts:139-148`); `gainArgs` adds a limiter and renders 48 kHz 24-bit (`apps/vocal-fix/src/lib/server/chain.ts:150-162`).
- `regressions` flags noise, clipping or overall scores that fell by more than 0.05 (`apps/vocal-fix/src/lib/server/chain.ts:164-174`).

## Connections

- **depends_on:** [[entities/mod-vf-diagnose]]
- **used_by:** [[entities/mod-vf-service]], [[entities/route-vf-get-capabilities]]
- **related:** [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/chain.ts`
