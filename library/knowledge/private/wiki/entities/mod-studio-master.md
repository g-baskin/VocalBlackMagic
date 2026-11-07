---
type: entity
title: "studio/master.ts (ffmpeg Studio Master and references)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/master.ts"
language: ts
depends_on:
  - "[[entities/mod-music-errors]]"
  - "[[entities/env-ffmpeg-path]]"
used_by:
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/route-ttb-get-studio-capabilities]]"
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
  - "[[concepts/premium-studio]]"
  - "[[concepts/studio-derived-songs]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/master.ts"
---

# studio/master.ts (ffmpeg Studio Master and references)

## Overview

Local ffmpeg processing: a two-pass loudness master to a new 24-bit WAV, plus 30 s MP3 reference excerpts for models.

## Signature / Definition

```ts
export const ffmpegPath: string
export interface Loudness { input_i; input_tp; input_lra; input_thresh; target_offset }
export function measureArgs(input: string): string[]
export function masterArgs(input: string, output: string, measured: Loudness): string[]
export function parseLoudnorm(stderr: string): Loudness & { output_i: string; output_tp: string }
export async function masterFile(input: string, output: string)
export function referenceArgs(input: string, output: string): string[]
export async function makeReference(input: string, output: string): Promise<void>
export function instrumentalArgs(stems: string[], output: string): string[]
export async function makeInstrumental(stems: string[], output: string): Promise<void>
```

## Behavior

- `ffmpegPath` is `FFMPEG_PATH`, else `ffmpeg` on PATH, else `/usr/local/bin/ffmpeg` (`apps/ttb-studio/src/lib/server/studio/master.ts:4-5`).
- The tone chain is a 28 Hz high-pass, a small cut at 280 Hz, lifts at 3.5 kHz and an 11 kHz shelf, and a 2:1 glue compressor; the loudness target is `I=-14:TP=-1:LRA=11` (`apps/ttb-studio/src/lib/server/studio/master.ts:16-23`).
- Pass one measures with `loudnorm ... print_format=json` to a null sink (`apps/ttb-studio/src/lib/server/studio/master.ts:25-37`); pass two applies the measured values with `linear=true` and writes 44.1 kHz `pcm_s24le` (`apps/ttb-studio/src/lib/server/studio/master.ts:39-68`).
- `parseLoudnorm` reads the last `{...}` block of stderr and requires every key to be numeric or `inf`, so silent input fails with a 500 (`apps/ttb-studio/src/lib/server/studio/master.ts:73-92`).
- ffmpeg runs with an argument array (no shell), is killed after 300 s, and a non-zero exit is a 500 `ProviderError` logging the last 500 stderr characters (`apps/ttb-studio/src/lib/server/studio/master.ts:94-105`).
- `masterFile` returns input LUFS, output LUFS and output true peak and never modifies the input (`apps/ttb-studio/src/lib/server/studio/master.ts:108-116`).
- Reference excerpts are 30 s, stereo, 44.1 kHz, 128 kbps MP3 (`apps/ttb-studio/src/lib/server/studio/master.ts:119-143`); the instrumental reference mixes stems with `amix ... normalize=0` and a 0.95 limiter (`apps/ttb-studio/src/lib/server/studio/master.ts:146-171`).

## Connections

- **depends_on:** [[entities/mod-music-errors]], [[entities/env-ffmpeg-path]]
- **used_by:** [[entities/mod-studio-derive]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-edit]], [[entities/route-ttb-get-studio-capabilities]], [[entities/test-studio-studio]]
- **related:** [[concepts/premium-studio]], [[concepts/studio-derived-songs]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/master.ts`
