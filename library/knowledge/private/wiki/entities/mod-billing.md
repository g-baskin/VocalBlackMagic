---
type: entity
title: "@vbm/billing (packages/billing/src/index.ts)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/billing/src/index.ts"
language: ts
depends_on: []
used_by: []
last_commit_hash: "0d84c39"
tested_by: []
tags:
  - entity
  - module
  - package
  - billing
related: []
sources:
  - "packages/billing/src/index.ts"
---

# @vbm/billing (packages/billing/src/index.ts)

## Overview

Planning interfaces only; the header comment states no payments or balances are processed (`packages/billing/src/index.ts:1`).

## Signature / Definition

```ts
export type ProductId = 'vocal-fix' | 'ttb-studio'
export interface CreditLedgerEntry { id; tenantId; product; delta; reason; idempotencyKey; createdAt }
export interface SubscriptionEntitlement { tenantId; planId; active; monthlyCredits }
```

## Behavior

- `CreditLedgerEntry` carries an `idempotencyKey` (`packages/billing/src/index.ts:3-11`).
- `SubscriptionEntitlement` declares `monthlyCredits` (`packages/billing/src/index.ts:12-17`).
- The code graph records no importer of this package at 29c84e47.

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05

## Sources

- `packages/billing/src/index.ts`
