---
type: concept
title: "Vocal reference session"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "reference session"
  - "Vocal Fix session"
  - "VocalReferenceSession"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/consent-record]]"
  - "[[concepts/gold-vocal]]"
sources:
  - "apps/vocal-fix/src/lib/server/storage.ts"
  - "apps/vocal-fix/src/lib/server/service.ts"
  - "apps/vocal_fix/app.py"
  - "docs/GLOSSARY.md"
---

# Vocal reference session

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior: only five-file Python sessions, unverified, status `uploaded-awaiting-processing`. Now: SvelteKit sessions of one or five decode-verified takes (`apps/vocal-fix/src/lib/server/service.ts:105-180`).

## Definition

A UUID-named folder of uploaded recordings plus `manifest.json`. It is not an authenticated login session (`docs/GLOSSARY.md:10`).

## How it works

- SvelteKit sessions live at `<data>/vocal-fix/sessions/<uuid>` with `originals/`, `derived/` and an atomically written manifest (`apps/vocal-fix/src/lib/server/storage.ts:71-120`).
- Mode `fix` takes one file and `forge` five (`apps/vocal-fix/src/lib/server/service.ts:119-126`); files are stored as `take-<n><ext>` and marked `integrity_verified: true` only after ffprobe and a full decode pass (`apps/vocal-fix/src/lib/server/service.ts:144-167`).
- The manifest also holds derived versions, gold, profile, voices and an audit list (`apps/vocal-fix/src/lib/server/storage.ts:53-65`).
- The legacy Python prototype still has its own five-file reference sessions with `integrity_verified: False` (`apps/vocal_fix/app.py:110-119`).

## Why it matters

Session ids are the only access control besides the dev gate and loopback guard.

## Examples in this codebase

- [[entities/mod-vf-storage]]
- [[entities/route-vf-post-sessions]]

## Prior description (stale)

> [!stale]
> Superseded at commit `f88cc09` (2026-11-06). Reason: the app now stores and verifies sessions itself.

- Created by the Python endpoint (`apps/vocal_fix/app.py:81-93`) under `VFM_DATA_DIR`; files `source_<n><ext>`, `integrity_verified: False`; upload success meant extension and size checks only.

## Connections

- **involves entities:** [[entities/mod-vf-storage]], [[entities/mod-vf-service]], [[entities/route-vf-post-sessions]], [[entities/route-vf-get-sessions-id]], [[entities/route-vf-delete-sessions-id]], [[entities/ep-vf-post-references]], [[entities/route-vf-post-references]], [[entities/contract-vocal-reference-session]], [[entities/env-vbm-data-dir]], [[entities/env-vfm-data-dir]]
- **related concepts:** [[concepts/consent-record]], [[concepts/gold-vocal]]

## Sources

- `apps/vocal-fix/src/lib/server/storage.ts`
- `apps/vocal-fix/src/lib/server/service.ts`
- `apps/vocal_fix/app.py`
- `docs/GLOSSARY.md`
