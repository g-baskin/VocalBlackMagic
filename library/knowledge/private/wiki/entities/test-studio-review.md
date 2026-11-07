---
type: entity
title: "studio/review.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/review.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-runner-capabilities]]"
  - "[[entities/mod-studio-seal]]"
  - "[[entities/mod-music-errors]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - test
  - ttb-studio
  - studio
  - test
related: []
sources:
  - "apps/ttb-studio/src/lib/server/studio/review.test.ts"
---

# studio/review.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/review.test.ts
```

## Behavior

- sealed takes hide price, runner params and self-written lyrics (`apps/ttb-studio/src/lib/server/studio/review.test.ts:75-98`).
- synchronous routed results (ElevenLabs direct) get cover art (`apps/ttb-studio/src/lib/server/studio/review.test.ts:100-137`).
- one engine health read per call, shared failure (`apps/ttb-studio/src/lib/server/studio/review.test.ts:139-189`).
- bounded duration probe; extend continues without duration, repaint refuses (`apps/ttb-studio/src/lib/server/studio/review.test.ts:191-239`).
- transient engine polling errors keep the task running (`apps/ttb-studio/src/lib/server/studio/review.test.ts:241-306`).

## Connections

- **depends_on:** [[entities/mod-studio-create]], [[entities/mod-studio-edit]], [[entities/mod-studio-jobs]], [[entities/mod-studio-library]], [[entities/mod-studio-runner-capabilities]], [[entities/mod-studio-seal]], [[entities/mod-music-errors]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/review.test.ts`
