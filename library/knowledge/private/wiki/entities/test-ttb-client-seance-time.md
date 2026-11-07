---
type: entity
title: "seance-time.test.ts"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/seance-time.test.ts"
language: ts
depends_on:
  - "[[entities/mod-ttb-client-seance-time]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - test
related: []
sources:
  - "apps/ttb-studio/src/lib/client/seance-time.test.ts"
---

# seance-time.test.ts

## Overview

Bun tests for séance timing, including a regression where every take used the longest take's length (`apps/ttb-studio/src/lib/client/seance-time.test.ts:4-12`).

## Signature / Definition

```ts
describe(...) // bun:test
```

## Behavior

- Per-take duration and clamping (`apps/ttb-studio/src/lib/client/seance-time.test.ts:6-17`); `cannotCompare` cases (`apps/ttb-studio/src/lib/client/seance-time.test.ts:20-31`).

## Connections

- **depends_on:** [[entities/mod-ttb-client-seance-time]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/seance-time.test.ts`
