---
type: entity
title: "ENGINE_PROTOCOL_VERSION"
entity_type: exported-symbol
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/contracts/src/engine.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-engine]]"
used_by:
  - "[[entities/mod-studio-runner-engine]]"
last_commit_hash: "09057ad"
tested_by: []
symbol_kind: const
shape_summary: "1"
is_default_export: false
tags:
  - entity
  - exported-symbol
  - contract
  - engine-protocol
related:
  - "[[entities/contract-engine-health]]"
  - "[[concepts/contracts-engine-protocol-parity]]"
sources:
  - "packages/contracts/src/engine.ts"
---

# ENGINE_PROTOCOL_VERSION

## Overview

Protocol version constant, currently `1` (`packages/contracts/src/engine.ts:6`).

## Signature / Definition

```ts
export const ENGINE_PROTOCOL_VERSION = 1
```

## Behavior

- The header requires bumping it whenever TS and Python shapes change together (`packages/contracts/src/engine.ts:2-4`).
- The Studio runner treats an engine whose health `protocol` differs as unusable (`apps/ttb-studio/src/lib/server/studio/runners/engine.ts:75-81`).

## Connections

- **depends_on:** [[entities/mod-contracts-engine]]
- **used_by:** [[entities/mod-studio-runner-engine]]
- **related:** [[entities/contract-engine-health]], [[concepts/contracts-engine-protocol-parity]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `packages/contracts/src/engine.ts`
