---
type: entity
title: "studio/gold.ts (Gold Vocal file lookup)"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/gold.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-voice]]"
  - "[[entities/mod-music-errors]]"
used_by:
  - "[[entities/mod-studio-voicesummon]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - function
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-derived-songs]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/gold.ts"
---

# studio/gold.ts (Gold Vocal file lookup)

## Overview

Finds the newest Gold Vocal WAV produced by Vocal Fix for a voice's consent session, strictly inside the data dir.

## Signature / Definition

```ts
export async function goldVocalFile(root: string, voice: VoiceModel): Promise<string>
```

## Behavior

- The consent `session_id` must be a UUID, else 422 (`apps/ttb-studio/src/lib/server/studio/gold.ts:11-13`).
- Reads `<root>/vocal-fix/sessions/<session>/manifest.json`, keeps `kind: gold` versions whose file matches `gold.*.wav`, and picks the newest `created_at`; an unreadable manifest falls back to `gold.gold.v1.wav` (`apps/ttb-studio/src/lib/server/studio/gold.ts:14-32`).
- The resolved file must stay in the session `derived` folder (422) and exist (404 telling the user to build one in Vocal Fix) (`apps/ttb-studio/src/lib/server/studio/gold.ts:33-39`).

## Connections

- **depends_on:** [[entities/mod-contracts-voice]], [[entities/mod-music-errors]]
- **used_by:** [[entities/mod-studio-voicesummon]]
- **related:** [[concepts/studio-derived-songs]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/gold.ts`
