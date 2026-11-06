---
type: entity
title: "@vbm/auth (packages/auth/src/index.ts)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/auth/src/index.ts"
language: ts
depends_on: []
used_by: []
last_commit_hash: "0d84c39"
tested_by: []
tags:
  - entity
  - module
  - package
  - auth
related:
  - "[[concepts/production-403-guard]]"
sources:
  - "packages/auth/src/index.ts"
---

# @vbm/auth (packages/auth/src/index.ts)

## Overview

Authorization contract only; the header comment states that no identity provider is integrated (`packages/auth/src/index.ts:1-4`).

## Signature / Definition

```ts
export interface SaaSSession { subject; tenantId; emailVerified; roles }
export function assertAuthenticated(session: SaaSSession | null): asserts session is SaaSSession
```

## Behavior

- `assertAuthenticated` throws unless the supplied object has `subject`, `tenantId` and `emailVerified` true (`packages/auth/src/index.ts:11-15`). It checks a supplied object; it does not establish a session.
- The code graph records no importer of this package at 29c84e47.

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** [[concepts/production-403-guard]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05

## Sources

- `packages/auth/src/index.ts`
