---
type: entity
title: "studio/library.ts (file-backed SongLibrary)"
entity_type: class
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/library.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
used_by:
  - "[[entities/mod-studio-context]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/route-ttb-get-studio-songs-id-audio]]"
  - "[[entities/test-studio-studio]]"
  - "[[entities/test-studio-edit]]"
  - "[[entities/test-studio-review]]"
  - "[[entities/test-studio-seal]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
  - "[[entities/test-studio-edit]]"
  - "[[entities/test-studio-review]]"
  - "[[entities/test-studio-seal]]"
tags:
  - entity
  - class
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-song-library]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/library.ts"
---

# studio/library.ts (file-backed SongLibrary)

## Overview

The on-disk song library: one folder per song id under `<data>/studio/songs/<id>/` with `meta.json`, audio, stems and cover.

## Signature / Definition

```ts
export class LibraryError extends Error { readonly status: number }
export function isSongId(id: string): boolean
export function extensionFor(contentType: string): string
export class SongLibrary {
  reserve(); save(meta); get(id); list(); update(id, patch); remove(id)
  assetFile(id, relative); coverFile(id); audioFile(id, which)
}
export function parseWhich(raw: string | null): 'main' | StemName | null
```

## Behavior

- Song ids must be lower-case UUIDs (`apps/ttb-studio/src/lib/server/studio/library.ts:5`); a non-UUID id in `songDir` is a 404 `LibraryError`, which blocks path traversal (`apps/ttb-studio/src/lib/server/studio/library.ts:51-54`).
- Content types map to mp3, wav, flac or ogg, else `bin` (`apps/ttb-studio/src/lib/server/studio/library.ts:21-29`).
- `reserve` creates a random-UUID folder with a `stems/` subfolder; `save` writes `meta.json.tmp` then renames it, an atomic replace (`apps/ttb-studio/src/lib/server/studio/library.ts:57-70`).
- `get` reports 404 for an unreadable file and 500 for corrupt or mismatched metadata (`apps/ttb-studio/src/lib/server/studio/library.ts:72-88`); `list` skips corrupt folders and sorts newest first, then by id (`apps/ttb-studio/src/lib/server/studio/library.ts:90-108`).
- `update` trims the title and enforces 1 to 120 characters (422), and sets `favourite` (`apps/ttb-studio/src/lib/server/studio/library.ts:110-121`); `remove` deletes the folder after confirming it exists (`apps/ttb-studio/src/lib/server/studio/library.ts:123-126`).
- `assetFile` and `audioFile` resolve only names recorded in meta and refuse anything outside the song folder (`apps/ttb-studio/src/lib/server/studio/library.ts:129-136`, `apps/ttb-studio/src/lib/server/studio/library.ts:146-165`).
- `parseWhich` maps null, empty or `main` to `main`, a known stem name to itself, anything else to null (`apps/ttb-studio/src/lib/server/studio/library.ts:168-171`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]]
- **used_by:** [[entities/mod-studio-context]], [[entities/mod-studio-jobs]], [[entities/mod-studio-cover]], [[entities/mod-studio-voicesummon]], [[entities/route-ttb-get-studio-songs-id-audio]], [[entities/test-studio-studio]], [[entities/test-studio-edit]], [[entities/test-studio-review]], [[entities/test-studio-seal]]
- **related:** [[concepts/studio-song-library]]

## Tested by

- [[entities/test-studio-studio]]
- [[entities/test-studio-edit]]
- [[entities/test-studio-review]]
- [[entities/test-studio-seal]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/library.ts`
