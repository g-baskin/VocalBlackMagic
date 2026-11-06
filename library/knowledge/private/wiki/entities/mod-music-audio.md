---
type: entity
title: "music/audio.ts (audio verification)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/audio.ts"
language: ts
depends_on:
  - "[[entities/mod-music-errors]]"
used_by:
  - "[[entities/mod-music-lyria]]"
  - "[[entities/route-ttb-get-generation-audio]]"
  - "[[entities/test-music]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-music]]"
tags:
  - entity
  - module
  - ttb-studio
related:
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/audio.ts"
---

# music/audio.ts (audio verification)

## Overview

Verifies that provider output is real audio by magic-byte sniffing and size limits before it reaches the browser (`apps/ttb-studio/src/lib/server/music/audio.ts:1-149`).

## Signature / Definition

```ts
export type AudioKind = 'audio/wav' | 'audio/mpeg' | 'audio/flac' | 'audio/ogg'
export const minAudioBytes = 1024; export const maxAudioBytes = 160 MiB
export function sniffNeeds(head: Uint8Array): number
export function sniffAudio(head: Uint8Array): AudioKind | null
export function inspectBase64Audio(data: string): { kind: AudioKind; bytes: number }
export async function verifiedAudioResponse(upstream: Response): Promise<Response>
```

## Behavior

- Recognises RIFF/WAVE, ID3 or MPEG frame sync, `fLaC` and `OggS` headers (`apps/ttb-studio/src/lib/server/music/audio.ts:11-21`), and looks past an ID3 tag of up to 4 MiB (`apps/ttb-studio/src/lib/server/music/audio.ts:23-48`).
- `inspectBase64Audio` rejects malformed base64, payloads under 1024 bytes or over 160 MiB, and unrecognised data with a 502 `ProviderError` (`apps/ttb-studio/src/lib/server/music/audio.ts:52-68`).
- `verifiedAudioResponse` rejects non-OK upstreams and out-of-range `content-length`, sniffs the head, then streams the rest while erroring on truncation or overflow (`apps/ttb-studio/src/lib/server/music/audio.ts:98-141`).
- The response sets the sniffed `content-type`, `cache-control: private, no-store` and `x-content-type-options: nosniff` (`apps/ttb-studio/src/lib/server/music/audio.ts:142-148`).

## Connections

- **depends_on:** [[entities/mod-music-errors]]
- **used_by:** [[entities/mod-music-lyria]], [[entities/route-ttb-get-generation-audio]], [[entities/test-music]]
- **related:** [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/audio.ts`
