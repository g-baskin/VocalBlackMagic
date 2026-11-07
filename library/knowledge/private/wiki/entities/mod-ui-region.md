---
type: entity
title: "ui region.ts"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/region.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/ui-region-select]]"
  - "[[entities/test-ui-region]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-ui-region]]"
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[entities/contract-validate-edit-request]]"
sources:
  - "packages/ui/src/region.ts"
---

# ui region.ts

## Overview

Pure helpers for RegionSelect (`packages/ui/src/region.ts:1`), exported as `@vbm/ui/region`.

## Signature / Definition

```ts
interface Region { start; end }; LENGTH_EPSILON = 1e-6; clampRegion(region, total, minLength = 1, maxLength = Infinity, moved = "end"); nudge(key, shift, value, total); timeAt(clientX, left, width, total); formatPrecise(seconds)
```

## Behavior

- `clampRegion` keeps `0 <= start < end <= total` with length in [min, max], adjusting the side that did not move, rounding to 0.01 s (`packages/ui/src/region.ts:12-37`).
- The 1e-6 tolerance (`packages/ui/src/region.ts:9-10`) matches the 1 s repaint check in `validateEditRequest` (`packages/contracts/src/studio.ts:401`).
- Arrows nudge 0.1 s (1 s with shift), PageUp/PageDown 10 s, Home/End jump (`packages/ui/src/region.ts:39-49`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-region-select]], [[entities/test-ui-region]]
- **related:** [[entities/contract-validate-edit-request]]

## Tested by

- [[entities/test-ui-region]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `packages/ui/src/region.ts`
