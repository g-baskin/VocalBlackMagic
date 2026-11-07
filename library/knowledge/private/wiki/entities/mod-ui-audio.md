---
type: entity
title: "ui audio.ts (real audio analysis)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/audio.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/ui-ab-compare]]"
  - "[[entities/ui-grimoire-player]]"
  - "[[entities/ui-pitch-trace]]"
  - "[[entities/ui-rune-recorder]]"
  - "[[entities/ui-spectrogram]]"
  - "[[entities/ui-voice-sigil]]"
  - "[[entities/ui-waveform]]"
  - "[[entities/test-ui-audio]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-ui-audio]]"
tags:
  - entity
  - module
  - package
  - ui
  - audio
related:
  - "[[concepts/ui-real-audio-visuals]]"
sources:
  - "packages/ui/src/audio.ts"
---

# ui audio.ts (real audio analysis)

## Overview

Real audio analysis helpers, pure except the AudioContext used for decoding (`packages/ui/src/audio.ts:1`). Exported as `@vbm/ui/audio`.

## Signature / Definition

```ts
decodeAudioFromBlob, decodeAudioFromUrl, mixToMono, computePeaks, computeSpectrogram, detectPitch, hzToMidi, hzToNote, formatTime, rmsDbfs, pitchClassHistogram, energyEnvelope, spectralCentroid
```

## Behavior

- Decoding from blob or URL with optional abort (`packages/ui/src/audio.ts:14-19`); radix-2 FFT (`packages/ui/src/audio.ts:63`); Hann-window STFT in dBFS (`packages/ui/src/audio.ts:99-100`).
- YIN pitch tracker where 0 Hz marks unvoiced frames (`packages/ui/src/audio.ts:136-137`).
- Voice-print helpers: RMS dBFS (`packages/ui/src/audio.ts:212-213`), pitch-class histogram (`packages/ui/src/audio.ts:221-222`), energy envelope (`packages/ui/src/audio.ts:235-236`), spectral centroid (`packages/ui/src/audio.ts:254-255`).
- Imported by 10 app files, e.g. `apps/ttb-studio/src/lib/client/AbPlayer.svelte:5`, `apps/vocal-fix/src/routes/session/[id]/+page.svelte:16`.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-ab-compare]], [[entities/ui-grimoire-player]], [[entities/ui-pitch-trace]], [[entities/ui-rune-recorder]], [[entities/ui-spectrogram]], [[entities/ui-voice-sigil]], [[entities/ui-waveform]], [[entities/test-ui-audio]]
- **related:** [[concepts/ui-real-audio-visuals]]

## Tested by

- [[entities/test-ui-audio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/audio.ts`
