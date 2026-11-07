---
type: entity
title: "studio/seal.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/seal.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-create]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-studio-seal]]"
  - "[[entities/mod-studio-seance]]"
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
  - "apps/ttb-studio/src/lib/server/studio/seal.test.ts"
---

# studio/seal.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/seal.test.ts
```

## Behavior

- seance job cap of 4 vs normal cap of 3 (`apps/ttb-studio/src/lib/server/studio/seal.test.ts:98-128`).
- sealed then unsealed takes; unreadable seance fails closed (`apps/ttb-studio/src/lib/server/studio/seal.test.ts:130-173`).

## Connections

- **depends_on:** [[entities/mod-studio-create]], [[entities/mod-studio-jobs]], [[entities/mod-studio-library]], [[entities/mod-studio-seal]], [[entities/mod-studio-seance]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/seal.test.ts`
