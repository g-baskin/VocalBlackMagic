---
type: entity
title: "replicate.delivery"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/replicate.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/mod-vf-replicate]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - "entity"
  - "service"
  - "external"
related:
  - "[[entities/ext-api-replicate-com]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/replicate.ts"
  - "apps/vocal-fix/src/lib/server/replicate.ts"
---

# replicate.delivery

## Overview

Replicate's output file host. Both apps download prediction outputs from here, and both refuse any other output host (`apps/ttb-studio/src/lib/server/studio/replicate.ts:177-188`, `apps/vocal-fix/src/lib/server/replicate.ts:33-38`).

## Signature / Definition

```text
https://replicate.delivery
https://<subdomain>.replicate.delivery
```

## Behavior

- Kind: real download target. The URL comes from a Replicate prediction's `output`; the host is checked against an allow-list before any fetch.
- TTB Studio: `isAllowedOutputUrl` accepts only `https:` URLs whose host is `replicate.delivery` or ends with `.replicate.delivery` (`apps/ttb-studio/src/lib/server/studio/replicate.ts:178-188`). Downloads send no Replicate token and follow redirects manually, re-checking each hop, and give up with 502 after too many redirects (`apps/ttb-studio/src/lib/server/studio/replicate.ts:205-228`).
- Vocal Fix: the same host rule (`apps/vocal-fix/src/lib/server/replicate.ts:33-38`); any other host raises a 502 `VocalFixError`, and redirects are refused outright with `redirect: 'error'` (`apps/vocal-fix/src/lib/server/replicate.ts:162-163`).
- Inline base64 data URIs are also accepted as TTB Studio outputs and need no download (`apps/ttb-studio/src/lib/server/studio/replicate.ts:233-235`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-studio-replicate]], [[entities/mod-vf-replicate]]
- **related:** [[entities/ext-api-replicate-com]]

## Tested by

- [[entities/test-studio-studio]]: allow-list, no token on download, off-host redirect refused (`apps/ttb-studio/src/lib/server/studio/studio.test.ts:130-144`).

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` on 2026-11-06
