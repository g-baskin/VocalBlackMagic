---
type: entity
title: "contracts index.test.ts (bun:test)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/index.test.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by: []
last_commit_hash: "29c84e4"
tested_by: []
tags:
  - entity
  - module
  - test
related: []
sources:
  - "packages/contracts/src/index.test.ts"
---

# contracts index.test.ts (bun:test)

## Overview

Bun tests for `validateGenerationRequest` and sound characters (`packages/contracts/src/index.test.ts:15-27`).

## Signature / Definition

```ts
test suite
```

## Behavior

- Covers five sound characters, a valid request, out-of-range intensity, short prompts, the Lyria engine and song length bounds (`packages/contracts/src/index.test.ts:15-27`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `packages/contracts/src/index.test.ts`
