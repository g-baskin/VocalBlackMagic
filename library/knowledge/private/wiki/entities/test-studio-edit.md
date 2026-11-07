---
type: entity
title: "studio/edit.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/edit.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-library]]"
  - "[[entities/mod-contracts-studio]]"
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
  - "apps/ttb-studio/src/lib/server/studio/edit.test.ts"
---

# studio/edit.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/edit.test.ts
```

## Behavior

- edit validation via `validateEditRequest` (`apps/ttb-studio/src/lib/server/studio/edit.test.ts:90-127`).
- engine and fal edit body mapping (`apps/ttb-studio/src/lib/server/studio/edit.test.ts:129-161`).
- edit routing: capability reasons, engine skip to fal producing a new child song, refusal fallback vs no fallback after acceptance, repaint past the end refused before any provider call (`apps/ttb-studio/src/lib/server/studio/edit.test.ts:163-256`).

## Connections

- **depends_on:** [[entities/mod-studio-edit]], [[entities/mod-studio-jobs]], [[entities/mod-studio-library]], [[entities/mod-contracts-studio]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/edit.test.ts`
