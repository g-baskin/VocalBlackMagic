---
type: entity
title: "@vbm/database (packages/database/src/index.ts)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/database/src/index.ts"
language: ts
depends_on: []
used_by: []
last_commit_hash: "0d84c39"
tested_by: []
tags:
  - entity
  - module
  - package
related:
  - "[[concepts/consent-record]]"
sources:
  - "packages/database/src/index.ts"
---

# @vbm/database (packages/database/src/index.ts)

## Overview

Future persistence contracts; the header comment states no database connection is initialized (`packages/database/src/index.ts:1`).

## Signature / Definition

```ts
export interface ProjectRecord { id; tenantId; product; createdAt }
export interface AudioAssetRecord { id; tenantId; projectId; storageKey; sha256; ownerConsentId: string | null }
```

## Behavior

- `AudioAssetRecord.ownerConsentId` is the only consent link in these contracts and is nullable (`packages/database/src/index.ts:8-15`).
- Unchanged since `0d84c39`. Re-verified at HEAD `b58d457`: no source import in `apps/`, `services/` or `packages/` (grep); both apps only declare it as a workspace dependency (`apps/ttb-studio/package.json:13-17`, `apps/vocal-fix/package.json:13-17`).

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** [[concepts/consent-record]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05

## Sources

- `packages/database/src/index.ts`
