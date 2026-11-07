---
type: concept
title: "Vocal Fix repair pipeline"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "fix a take"
  - "never-worse polish"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/vocal-fix-job-runner]]"
  - "[[concepts/reference-session]]"
  - "[[concepts/gold-vocal]]"
sources:
  - "apps/vocal-fix/src/lib/server/service.ts"
  - "apps/vocal-fix/src/lib/server/chain.ts"
  - "apps/vocal-fix/src/lib/server/media.ts"
---

# Vocal Fix repair pipeline

## Definition

The SvelteKit server path that takes verified recordings through diagnosis, optional hosted isolation and enhancement, and a local ffmpeg polish into new derived versions (decision record `docs/decisions/0004-vocal-fix-pipeline-in-sveltekit.md`).

## How it works

- Intake verifies each file with ffprobe and a full decode before storing it as verified (`apps/vocal-fix/src/lib/server/service.ts:143-167`, `apps/vocal-fix/src/lib/server/media.ts:111-146`).
- Diagnosis measures loudness, noise, clipping and silence (`apps/vocal-fix/src/lib/server/diagnose.ts:230-250`).
- Repair runs as a job: compressed inputs transcode to temporary WAV, then optional Demucs and resemble-enhance on Replicate, then polish (`apps/vocal-fix/src/lib/server/service.ts:302-336`, `apps/vocal-fix/src/lib/server/service.ts:347-429`).
- Polish is two passes (shaping chain, then capped gain and limiter); if key scores drop by more than 0.05 a stronger pass is tried and kept only if it regresses less, and remaining regressions are reported as warnings (`apps/vocal-fix/src/lib/server/service.ts:430-528`, `apps/vocal-fix/src/lib/server/chain.ts:164-174`).
- Each output is a new file in `derived/` with hash, params and provenance; originals are written once with `wx` and not modified (`apps/vocal-fix/src/lib/server/service.ts:148`, `apps/vocal-fix/src/lib/server/service.ts:212-232`).

## Why it matters

It keeps raw sources intact and reports regressions instead of hiding them. Hosted stages spend paid credit; the only protection is the development-only gate, with no spend cap.

## Examples in this codebase

- [[entities/mod-vf-service]]
- [[entities/mod-vf-chain]]
- [[entities/route-vf-post-sessions-id-repair]]

## Connections

- **involves entities:** [[entities/mod-vf-service]], [[entities/mod-vf-chain]], [[entities/mod-vf-diagnose]], [[entities/mod-vf-media]], [[entities/mod-vf-replicate]], [[entities/mod-vf-storage]], [[entities/route-vf-post-sessions]], [[entities/route-vf-post-sessions-id-diagnose]], [[entities/route-vf-post-sessions-id-repair]], [[entities/route-vf-page-session-id]], [[entities/ext-api-replicate-com]]
- **related concepts:** [[concepts/vocal-fix-job-runner]], [[concepts/reference-session]], [[concepts/gold-vocal]]

## Sources

- `apps/vocal-fix/src/lib/server/service.ts`
- `apps/vocal-fix/src/lib/server/chain.ts`
- `apps/vocal-fix/src/lib/server/media.ts`
