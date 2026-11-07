---
type: entity
title: "studio/runners/router.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/router.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-runner-router]]"
  - "[[entities/mod-studio-runner-models]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-music-errors]]"
used_by: []
last_commit_hash: "09057ad"
tested_by: []
tags:
  - entity
  - test
  - ttb-studio
  - studio
  - test
related: []
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/router.test.ts"
---

# studio/runners/router.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/runners/router.test.ts
```

## Behavior

- runner listing, key skips, fallback only after refusal, NoRunner 503, replicateRefusal classification (`apps/ttb-studio/src/lib/server/studio/runners/router.test.ts:22-82`).

## Connections

- **depends_on:** [[entities/mod-studio-runner-router]], [[entities/mod-studio-runner-models]], [[entities/mod-studio-runner-engine]], [[entities/mod-music-errors]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/router.test.ts`
