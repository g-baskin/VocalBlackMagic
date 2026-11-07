---
type: concept
title: "Studio derived songs"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "non-destructive edits"
  - "child songs"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - studio
related:
  - "[[concepts/premium-studio]]"
  - "[[concepts/studio-song-library]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/derive.ts"
  - "apps/ttb-studio/src/lib/server/studio/edit.ts"
  - "apps/ttb-studio/src/lib/server/studio/voicesummon.ts"
---

# Studio derived songs

## Definition

Stems, reimagine, voice conversion, Studio Master and edits all produce a new song with `parent_id`; the parent files are never written.

## How it works

- Derived work in `apps/ttb-studio/src/lib/server/studio/derive.ts:36-204`; edits in `apps/ttb-studio/src/lib/server/studio/edit.ts:1-16`.
- Voice work requires ready, own-voice-consented voices and records consent metadata (`apps/ttb-studio/src/lib/server/studio/voices.ts:6-13`, `apps/ttb-studio/src/lib/server/studio/derive.ts:160-165`).
- Voice summons condition on the Gold Vocal from Vocal Fix (`apps/ttb-studio/src/lib/server/studio/voicesummon.ts:70-118`).
- Children inherit the parent cover (`apps/ttb-studio/src/lib/server/studio/cover.ts:133-148`).

## Why it matters

It honours the repo rule to preserve original audio and create versioned derived mixes.

## Examples in this codebase

- [[entities/mod-studio-derive]]
- [[entities/mod-studio-edit]]

## Connections

- **involves entities:** [[entities/mod-studio-derive]], [[entities/mod-studio-edit]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-gold]], [[entities/mod-studio-voices]], [[entities/mod-studio-master]], [[entities/mod-studio-cover]]
- **related concepts:** [[concepts/premium-studio]], [[concepts/studio-song-library]]

## Sources

- `apps/ttb-studio/src/lib/server/studio/derive.ts`
- `apps/ttb-studio/src/lib/server/studio/edit.ts`
- `apps/ttb-studio/src/lib/server/studio/voicesummon.ts`
