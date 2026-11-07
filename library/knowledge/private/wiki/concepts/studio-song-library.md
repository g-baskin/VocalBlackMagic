---
type: concept
title: "Studio song library"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "SongLibrary"
  - "studio data dir"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - studio
related:
  - "[[concepts/studio-job-lifecycle]]"
  - "[[concepts/studio-derived-songs]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/library.ts"
  - "apps/ttb-studio/src/lib/server/studio/paths.ts"
  - "apps/ttb-studio/src/lib/server/studio/range.ts"
---

# Studio song library

## Definition

Songs persist as folders `<data>/studio/songs/<uuid>/` holding `meta.json`, audio, stems and cover, under a data dir from `VBM_DATA_DIR` or the repo root.

## How it works

- Data dir resolution (`apps/ttb-studio/src/lib/server/studio/paths.ts:5-18`); folder layout and atomic meta writes (`apps/ttb-studio/src/lib/server/studio/library.ts:44-70`, `apps/ttb-studio/src/lib/server/studio/library.ts:64-70`).
- Files are resolved only from names in meta, inside the song folder (`apps/ttb-studio/src/lib/server/studio/library.ts:129-165`).
- Routes are dev-only and answer only on localhost (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`).
- Files are served with byte ranges and `private, no-store` (`apps/ttb-studio/src/lib/server/studio/range.ts:24-60`).

## Why it matters

This is the first stored audio in TTB Studio; it is local, unauthenticated and not tenant-scoped, so it must stay behind the dev gate.

## Examples in this codebase

- [[entities/mod-studio-library]]
- [[entities/mod-studio-range]]

## Connections

- **involves entities:** [[entities/mod-studio-library]], [[entities/mod-studio-paths]], [[entities/mod-studio-range]], [[entities/mod-studio-context]], [[entities/mod-studio-cover]], [[entities/env-vbm-data-dir]]
- **related concepts:** [[concepts/studio-job-lifecycle]], [[concepts/studio-derived-songs]]

## Sources

- `apps/ttb-studio/src/lib/server/studio/library.ts`
- `apps/ttb-studio/src/lib/server/studio/paths.ts`
- `apps/ttb-studio/src/lib/server/studio/range.ts`
