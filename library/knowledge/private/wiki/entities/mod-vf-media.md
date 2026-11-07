---
type: entity
title: "lib/server/media.ts (ffmpeg and ffprobe)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/media.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-errors]]"
  - "[[entities/env-vbm-ffmpeg]]"
  - "[[entities/env-vbm-ffprobe]]"
used_by:
  - "[[entities/mod-vf-service]]"
  - "[[entities/mod-vf-diagnose]]"
  - "[[entities/route-vf-post-sessions]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - audio
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal-fix/src/lib/server/media.ts"
---

# lib/server/media.ts (ffmpeg and ffprobe)

## Overview

Local media probing, verification and processing via subprocesses (`apps/vocal-fix/src/lib/server/media.ts:1-186`).

## Signature / Definition

```ts
export const FFMPEG, FFPROBE, MAX_UPLOAD_BYTES, MAX_DURATION_SECONDS, ALLOWED_CODECS
export async function run(cmd, args, opts?): Promise<RunResult>
export function parseProbe(json: string): Probe; export function checkLimits(probe: Probe): void
export async function probeAndVerify(path, signal?): Promise<Probe>
export async function decodePcm(path, rate, signal?): Promise<Float32Array>
export async function analyze(path, filter, signal?): Promise<string>
export async function ffmpeg(args, signal?, timeoutMs?): Promise<void>
```

## Behavior

- Tool paths: env var, else PATH, else `/usr/local/bin/<name>` (`apps/vocal-fix/src/lib/server/media.ts:4-10`). Limits: 100 MB upload, 600 s, a codec allowlist (`apps/vocal-fix/src/lib/server/media.ts:11-26`).
- `run` spawns with an argument array (no shell), a timeout kill and abort support; timeout maps to 504 and oversize stdout to 413 (`apps/vocal-fix/src/lib/server/media.ts:34-60`).
- `probeAndVerify` runs ffprobe, measures duration by decoding when missing, enforces limits, then requires a full `-xerror` decode to exit 0; warnings are kept as `decode_warnings` (`apps/vocal-fix/src/lib/server/media.ts:111-146`).
- `decodePcm`, `analyze` and `ffmpeg` wrap decode, filter analysis and rendering (`apps/vocal-fix/src/lib/server/media.ts:148-186`).

## Connections

- **depends_on:** [[entities/mod-vf-errors]], [[entities/env-vbm-ffmpeg]], [[entities/env-vbm-ffprobe]]
- **used_by:** [[entities/mod-vf-service]], [[entities/mod-vf-diagnose]], [[entities/route-vf-post-sessions]]
- **related:** [[concepts/vocal-fix-repair-pipeline]], [[concepts/reference-session]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/media.ts`
