---
type: entity
title: "lib/client/api.ts (browser fetch helper and URL builders)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/api.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/route-ttb-page]]"
  - "[[entities/route-ttb-page-library]]"
  - "[[entities/route-ttb-page-library-id]]"
  - "[[entities/route-ttb-page-lyrics]]"
  - "[[entities/route-ttb-page-seance]]"
  - "[[entities/mod-ttb-client-jobs]]"
  - "[[entities/ui-ttb-mini-wave]]"
  - "[[entities/ui-ttb-song-take]]"
  - "[[entities/ui-ttb-stem-mixer]]"
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - client
related:
  - "[[entities/route-ttb-get-studio-songs-id-audio]]"
  - "[[entities/route-ttb-get-studio-songs-id-cover]]"
  - "[[concepts/ttb-studio-api-surface]]"
sources:
  - "apps/ttb-studio/src/lib/client/api.ts"
---

# lib/client/api.ts (browser fetch helper and URL builders)

## Overview

JSON fetch wrapper plus audio and cover URL builders for the studio API (`apps/ttb-studio/src/lib/client/api.ts:1-20`).

## Signature / Definition

```ts
export async function api<T>(url: string, init?: RequestInit): Promise<T>
export const audioUrl: (id: string, stem?: string) => string
export const sleep: (ms: number) => Promise<unknown>
export const coverUrl: (id: string, version?: string) => string
```

## Behavior

- `api` sets `accept: application/json` and adds `content-type: application/json` only when a body is present; it replaces any caller headers (`apps/ttb-studio/src/lib/client/api.ts:2-4`).
- 204 returns undefined; a non-OK reply throws `detail` or a generic message with the status (`apps/ttb-studio/src/lib/client/api.ts:5-8`).
- `audioUrl` builds `/api/studio/songs/<id>/audio[?stem=]` (`apps/ttb-studio/src/lib/client/api.ts:11-12`); `coverUrl` builds `/api/studio/songs/<id>/cover[?v=]` as a cache buster (`apps/ttb-studio/src/lib/client/api.ts:16-20`). The stem value is not URL-encoded.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-ttb-page]], [[entities/route-ttb-page-library]], [[entities/route-ttb-page-library-id]], [[entities/route-ttb-page-lyrics]], [[entities/route-ttb-page-seance]], [[entities/mod-ttb-client-jobs]], [[entities/ui-ttb-mini-wave]], [[entities/ui-ttb-song-take]], [[entities/ui-ttb-stem-mixer]]
- **related:** [[entities/route-ttb-get-studio-songs-id-audio]], [[entities/route-ttb-get-studio-songs-id-cover]], [[concepts/ttb-studio-api-surface]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/api.ts`
