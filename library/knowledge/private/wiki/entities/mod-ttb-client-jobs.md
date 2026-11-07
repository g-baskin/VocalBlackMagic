---
type: entity
title: "lib/client/jobs.ts (followJob and WAV encoder)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/jobs.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/route-ttb-get-studio-jobs-id]]"
used_by:
  - "[[entities/route-ttb-page-library-id]]"
  - "[[entities/ui-ttb-stem-mixer]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - client
related:
  - "[[concepts/ttb-job-polling]]"
sources:
  - "apps/ttb-studio/src/lib/client/jobs.ts"
---

# lib/client/jobs.ts (followJob and WAV encoder)

## Overview

Client job follower and a 16-bit PCM WAV encoder (`apps/ttb-studio/src/lib/client/jobs.ts:1-55`).

## Signature / Definition

```ts
export async function followJob(id, onUpdate, isAlive): Promise<StudioJob | null>
export function encodeWav(buffer: AudioBuffer): Blob
```

## Behavior

- `followJob` sleeps 4 s, GETs `/api/studio/jobs/<id>`, swallows errors and retries without limit while `isAlive()`, and returns once status is neither `running` nor `queued` (`apps/ttb-studio/src/lib/client/jobs.ts:5-22`).
- `encodeWav` writes a 44-byte RIFF header and clamped interleaved samples (`apps/ttb-studio/src/lib/client/jobs.ts:25-55`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/route-ttb-get-studio-jobs-id]]
- **used_by:** [[entities/route-ttb-page-library-id]], [[entities/ui-ttb-stem-mixer]]
- **related:** [[concepts/ttb-job-polling]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/jobs.ts`
