---
type: entity
title: "lib/server/storage.ts (SessionStore and manifest)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/lib/server/storage.ts"
language: ts
depends_on:
  - "[[entities/mod-vf-errors]]"
used_by:
  - "[[entities/mod-vf-service]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-vf-server]]"
tags:
  - entity
  - module
  - vocal-fix
  - storage
  - security
related:
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal-fix/src/lib/server/storage.ts"
---

# lib/server/storage.ts (SessionStore and manifest)

## Overview

File-system session store with path containment checks (`apps/vocal-fix/src/lib/server/storage.ts:1-159`).

## Signature / Definition

```ts
export const SESSION_ID: RegExp; export const FILE_NAME: RegExp
export interface Manifest { id; mode; performer; created_at; consent; recordings; versions; gold?; profile?; voices; audit }
export class SessionStore { sessionDir(id); filePath(id, area, name); create(init); read(id); write(m); update(id, fn); exists(id); remove(id) }
```

## Behavior

- `SESSION_ID` is a lower-case UUID pattern and `FILE_NAME` a 1-121 character lower-case name pattern (`apps/vocal-fix/src/lib/server/storage.ts:6-7`).
- `Manifest` holds mode, performer, a consent object, recordings, derived versions, optional gold and profile, voice ids and an audit list (`apps/vocal-fix/src/lib/server/storage.ts:22-65`).
- Root is `<data>/vocal-fix/sessions`; `sessionDir` and `filePath` reject bad ids, bad names and any path escaping the root with 404 (`apps/vocal-fix/src/lib/server/storage.ts:71-94`).
- `write` is atomic via a temp file and rename (`apps/vocal-fix/src/lib/server/storage.ts:115-120`); `update` serializes read-modify-write per session in-process (`apps/vocal-fix/src/lib/server/storage.ts:122-138`).
- `remove` deletes the whole session directory (`apps/vocal-fix/src/lib/server/storage.ts:149-153`).

## Connections

- **depends_on:** [[entities/mod-vf-errors]]
- **used_by:** [[entities/mod-vf-service]]
- **related:** [[concepts/reference-session]]

## Tested by

- [[entities/test-vf-server]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/vocal-fix/src/lib/server/storage.ts`
