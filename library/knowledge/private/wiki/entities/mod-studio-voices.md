---
type: entity
title: "studio/voices.ts (voice registry reader)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/voices.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-voice]]"
used_by:
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/route-ttb-get-studio-capabilities]]"
  - "[[entities/route-ttb-get-studio-voices]]"
  - "[[entities/route-ttb-post-studio-songs-id-voice]]"
  - "[[entities/test-studio-studio]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-derived-songs]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/voices.ts"
---

# studio/voices.ts (voice registry reader)

## Overview

Reads the shared Voice Forge registry and filters it to voices the studio may sing with.

## Signature / Definition

```ts
export function isUsableVoice(voice: VoiceModel): voice is VoiceModel
export async function readVoices(root: string): Promise<VoiceModel[]>
export async function usableVoices(root: string): Promise<VoiceModel[]>
```

## Behavior

- A voice is usable only when `status` is `ready`, `consent.own_voice` is true, and it has an https `model_url` or a `model_file` (`apps/ttb-studio/src/lib/server/studio/voices.ts:6-13`).
- `readVoices` lists `<root>/shared/voices/*.json` in sorted order, requires the id to match `voiceIdPattern`, passes `isVoiceModel` and match its file name; unreadable entries are ignored (`apps/ttb-studio/src/lib/server/studio/voices.ts:15-36`).
- `usableVoices` is `readVoices` filtered by `isUsableVoice` (`apps/ttb-studio/src/lib/server/studio/voices.ts:38-40`).

## Connections

- **depends_on:** [[entities/mod-contracts-voice]]
- **used_by:** [[entities/mod-studio-derive]], [[entities/mod-studio-voicesummon]], [[entities/route-ttb-get-studio-capabilities]], [[entities/route-ttb-get-studio-voices]], [[entities/route-ttb-post-studio-songs-id-voice]], [[entities/test-studio-studio]]
- **related:** [[concepts/studio-derived-songs]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/voices.ts`
