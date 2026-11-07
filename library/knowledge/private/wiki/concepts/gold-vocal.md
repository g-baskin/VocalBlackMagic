---
type: concept
title: "Gold Vocal"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "GoldVocal"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/reference-session]]"
  - "[[concepts/vocal-fix-voice-forge]]"
sources:
  - "apps/vocal-fix/src/lib/server/service.ts"
  - "apps/vocal-fix/src/lib/server/gold.ts"
  - "docs/GLOSSARY.md"
---

# Gold Vocal

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior: not implemented (Python process returns 501). Now: implemented in SvelteKit by `VocalFixService.gold` (`apps/vocal-fix/src/lib/server/service.ts:530-626`).

## Definition

A curated set of clean representative vocal phrases with source provenance; never waveform averaging or an automatic identity clone (`docs/GLOSSARY.md:14`).

## How it works

- Needs a forge session in which every take has a repair (`apps/vocal-fix/src/lib/server/service.ts:530-542`).
- Phrases between silences are measured, ranked and picked round-robin across takes, honouring included and excluded ids (`apps/vocal-fix/src/lib/server/service.ts:543-572`, `apps/vocal-fix/src/lib/server/gold.ts:81-134`).
- Assembly trims each phrase from its own repaired take and joins them with silence; a sidecar records segment sources and SHA-256 (`apps/vocal-fix/src/lib/server/service.ts:573-600`).
- A descriptive profile is stored with it (`apps/vocal-fix/src/lib/server/service.ts:578-579`, `apps/vocal-fix/src/lib/server/service.ts:621-624`).

## Why it matters

It is the input to voice training, so its provenance is the audit link back to the original recordings.

## Examples in this codebase

- [[entities/mod-vf-gold]]
- [[entities/route-vf-post-sessions-id-gold]]

## Prior description (stale)

> [!stale]
> Superseded at commit `f88cc09` (2026-11-06). Reason: Gold Vocal assembly added.

- Not implemented: Python process endpoint always 501 (`apps/vocal_fix/app.py:156-162`), capabilities `gold_vocal: not-implemented`.

## Connections

- **involves entities:** [[entities/mod-vf-gold]], [[entities/mod-vf-profile]], [[entities/mod-vf-service]], [[entities/route-vf-post-sessions-id-gold]], [[entities/route-vf-page-session-id-gold]], [[entities/ep-vf-post-process]]
- **related concepts:** [[concepts/reference-session]], [[concepts/vocal-fix-voice-forge]]

## Sources

- `apps/vocal-fix/src/lib/server/service.ts`
- `apps/vocal-fix/src/lib/server/gold.ts`
- `docs/GLOSSARY.md`
