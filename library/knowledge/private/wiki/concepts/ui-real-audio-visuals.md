---
type: concept
title: "Real audio visuals (no fabricated waveforms)"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "honest visualisation"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/ui-arcane-design-system]]"
sources:
  - "packages/ui/src/audio.ts"
---

# Real audio visuals (no fabricated waveforms)

## Definition

Every audio visual in `@vbm/ui` is computed from decoded audio or a live analyser; with no audio, components show an empty state rather than decoration. This applies the repository rule against fabricated waveforms (`AGENTS.md`).

## How it works

- Analysis helpers are real DSP: FFT, STFT and YIN (`packages/ui/src/audio.ts:63-137`), unit-tested (`packages/ui/src/audio.test.ts:11-87`).
- Waveform, Spectrogram, PitchTrace and VoiceSigil take an `AudioBuffer | null` and fall back to EmptyState (`packages/ui/src/Waveform.svelte:4`, `packages/ui/src/Spectrogram.svelte:4`, `packages/ui/src/PitchTrace.svelte:4`, `packages/ui/src/VoiceSigil.svelte:9`).
- SummoningCircle reads a real analyser and disables itself for cross-origin media (`packages/ui/src/SummoningCircle.svelte:97`).
- GrimoirePlayer trusts the decoded buffer length over media metadata (`packages/ui/src/GrimoirePlayer.svelte:27`).

## Why it matters

Users judge vocal and mix quality from these visuals; a decorative waveform would misrepresent the audio.

## Examples in this codebase

- [[entities/ui-waveform]], [[entities/ui-spectrogram]], [[entities/ui-pitch-trace]], [[entities/ui-voice-sigil]], [[entities/ui-summoning-circle]]

## Connections

- **involves entities:** [[entities/mod-ui-audio]], [[entities/mod-ui-audio-graph]], [[entities/ui-empty-state]], [[entities/ui-grimoire-player]], [[entities/ui-ab-compare]], [[entities/test-ui-audio]]
- **related concepts:** [[concepts/ui-arcane-design-system]]

## Sources

- `packages/ui/src/audio.ts`
