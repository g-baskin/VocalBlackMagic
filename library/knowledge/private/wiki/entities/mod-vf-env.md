---
type: entity
title: "vocal-fix env.ts (env declarations)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/env.ts"
language: ts
depends_on:
  - "[[entities/env-replicate-api-token]]"
used_by:
  - "[[entities/mod-vf-svc]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - vocal-fix
  - config
related:
  - "[[concepts/vocal-fix-repair-pipeline]]"
sources:
  - "apps/vocal-fix/src/env.ts"
---

# vocal-fix env.ts (env declarations)

## Overview

SvelteKit environment schema for Vocal Fix (`apps/vocal-fix/src/env.ts:1-11`).

## Signature / Definition

```ts
export const variables = defineEnvVars({ REPLICATE_API_TOKEN: { schema: optionalKey } })
```

## Behavior

- Declares one optional server-only variable, `REPLICATE_API_TOKEN`, whose schema trims and turns blank into `undefined` (`apps/vocal-fix/src/env.ts:3-11`).
- A missing token does not stop the app; hosted stages answer 503 instead (`apps/vocal-fix/src/env.ts:3`, `apps/vocal-fix/src/lib/server/service.ts:91-99`).

## Connections

- **depends_on:** [[entities/env-replicate-api-token]]
- **used_by:** [[entities/mod-vf-svc]]
- **related:** [[concepts/vocal-fix-repair-pipeline]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/env.ts`
