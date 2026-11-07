---
type: entity
title: "studio/runners/engine.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/engine.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-contracts-engine]]"
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
  - "apps/ttb-studio/src/lib/server/studio/runners/engine.test.ts"
---

# studio/runners/engine.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/runners/engine.test.ts
```

## Behavior

- health readiness, idempotent submit, poll, audio, cancel, create-time refusal, off-origin audio refused (`apps/ttb-studio/src/lib/server/studio/runners/engine.test.ts:112-147`).

## Connections

- **depends_on:** [[entities/mod-studio-runner-engine]], [[entities/mod-contracts-engine]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/engine.test.ts`
