---
type: entity
title: "music/jobs.ts (job id codec)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/jobs.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-generation]]"
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
  - "[[entities/contract-generation-job]]"
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/jobs.ts"
---

# music/jobs.ts (job id codec)

## Overview

Encodes and decodes the public `job_id` string that names a provider job (`apps/ttb-studio/src/lib/server/music/jobs.ts:1-14`).

## Signature / Definition

```ts
export function falJobId(requestId: string): string
export function parseJobId(jobId: string): { provider: 'fal'; requestId: string } | { provider: 'lyria' } | null
```

## Behavior

- `falJobId` prefixes a fal request id with `fal.` (`apps/ttb-studio/src/lib/server/music/jobs.ts:1-5`).
- `parseJobId` returns `{provider: 'fal', requestId}` (lower-cased) for `fal.` ids, `{provider: 'lyria'}` for `lyria.` ids, and null otherwise (`apps/ttb-studio/src/lib/server/music/jobs.ts:7-14`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/test-music]]
- **related:** [[entities/contract-generation-job]], [[concepts/hosted-generation-flow]]

## Tested by

- [[entities/test-music]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/jobs.ts`
