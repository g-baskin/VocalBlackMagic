---
type: entity
title: "lib/server/gold.ts (phrase selection and assembly)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/gold.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-vf-service]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - audio
related:
  - "[[concepts/gold-vocal]]"
sources:
  - "apps/vocal-fix/src/lib/server/gold.ts"
---

# lib/server/gold.ts (phrase selection and assembly)

## Overview

Gold Vocal curation primitives (`apps/vocal-fix/src/lib/server/gold.ts:1-204`).

## Signature / Definition

```ts
export function phrasesFromSilences(silences, duration)
export function measurePhrase(pcm, rate, start, end)
export function rankPhrases(candidates): RankedPhrase[]
export function selectPhrases(ranked, opts?): PhraseCandidate[]
export function layoutSegments(selected): GoldSegment[]
export function assemblyArgs(inputs, segments, out): string[]
```

## Behavior

- Phrases are non-silent spans of 0.6 to 12 s, joined with 0.35 s gaps (`apps/vocal-fix/src/lib/server/gold.ts:28-52`).
- `rankPhrases` weights clipping, SNR, loudness consistency and length (`apps/vocal-fix/src/lib/server/gold.ts:81-101`).
- `selectPhrases` honours included and excluded ids, skips clipped or low-score phrases, and picks round-robin across takes (`apps/vocal-fix/src/lib/server/gold.ts:104-134`).
- `assemblyArgs` trims each phrase from its own take and concatenates with silence, no blending (`apps/vocal-fix/src/lib/server/gold.ts:155-156`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-vf-service]]
- **related:** [[concepts/gold-vocal]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/gold.ts`
