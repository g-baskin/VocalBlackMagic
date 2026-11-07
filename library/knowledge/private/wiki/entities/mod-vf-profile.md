---
type: entity
title: "lib/server/profile.ts (descriptive voice profile)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/profile.ts"
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
  - "apps/vocal-fix/src/lib/server/profile.ts"
---

# lib/server/profile.ts (descriptive voice profile)

## Overview

Describes the Gold Vocal for the registry and prompts (`apps/vocal-fix/src/lib/server/profile.ts:1-198`).

## Signature / Definition

```ts
export function hzToNote(hz)
export function framePitch(frame, rate): number | null
export function analyzeProfile(pcm, rate): VoiceProfile
export function describeProfile(p): Record<string, string>
```

## Behavior

- Profile is limited to observable traits; no identity, gender or age guesses (`apps/vocal-fix/src/lib/server/profile.ts:1-2`).
- `framePitch` uses autocorrelation over 70 to 1000 Hz and picks the first lag near the best peak to avoid octave errors (`apps/vocal-fix/src/lib/server/profile.ts:51-56`).
- `analyzeProfile` and `describeProfile` produce plain-language descriptors, reporting when range cannot be measured (`apps/vocal-fix/src/lib/server/profile.ts:92`, `apps/vocal-fix/src/lib/server/profile.ts:166-177`).

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

- `apps/vocal-fix/src/lib/server/profile.ts`
