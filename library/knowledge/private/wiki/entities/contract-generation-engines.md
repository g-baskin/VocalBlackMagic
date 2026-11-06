---
type: entity
title: "generationEngines"
entity_type: exported-symbol
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/contract-validate-generation-request]]"
  - "[[entities/mod-music-capabilities]]"
last_commit_hash: "29c84e4"
tested_by:
  - "[[entities/test-contracts]]"
symbol_kind: const
shape_summary: "ace-step, lyria-3.5, heartmula, external-v2"
is_default_export: false
tags:
  - entity
  - exported-symbol
  - contract
related: []
sources:
  - "packages/contracts/src/index.ts"
---

# generationEngines

## Overview

Allowed engine ids (`packages/contracts/src/index.ts:10-11`).

## Signature / Definition

```ts
export const generationEngines = ['ace-step', 'lyria-3.5', 'heartmula', 'external-v2'] as const
```

## Behavior

- Only `ace-step` and `lyria-3.5` are implemented; others return 501 (`apps/ttb-studio/src/routes/api/generations/+server.ts:110`) and report `not-configured` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:29-30`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/contract-validate-generation-request]], [[entities/mod-music-capabilities]]
- **related:** none

## Tested by

- [[entities/test-contracts]]

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.ts`
