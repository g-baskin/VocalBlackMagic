---
type: concept
title: "Vocal reference session"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "reference session"
  - "VocalReferenceSession"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/consent-record]]"
  - "[[concepts/gold-vocal]]"
sources:
  - "apps/vocal_fix/app.py"
  - "docs/GLOSSARY.md"
---

# Vocal reference session

## Definition

A folder of exactly five uploaded recordings plus a `manifest.json`, named by a UUID `session_id`. It is not an authenticated login session (`docs/GLOSSARY.md:10`).

## How it works

- Created by the Python endpoint after rights and count checks (`apps/vocal_fix/app.py:81-93`), stored under `VFM_DATA_DIR` (`apps/vocal_fix/app.py:28-31`).
- Files are renamed `source_<n><ext>` and marked `integrity_verified: False` (`apps/vocal_fix/app.py:110-119`); the manifest status is `uploaded-awaiting-processing` (`apps/vocal_fix/app.py:127`).
- Read and deleted by id through UUID-checked routes (`apps/vocal_fix/app.py:34-41`, `apps/vocal_fix/app.py:144-153`).

## Why it matters

Upload success means extension and size checks, not decoded audio validation. Storage details: `library/knowledge/private/architecture/vocal-reference-storage.md`.

## Examples in this codebase

- [[entities/ep-vf-post-references]] creates it
- [[entities/contract-vocal-reference-session]] types it

## Connections

- **involves entities:** [[entities/ep-vf-post-references]], [[entities/ep-vf-get-reference]], [[entities/ep-vf-delete-reference]], [[entities/route-vf-post-references]], [[entities/contract-vocal-reference-session]], [[entities/env-vfm-data-dir]]
- **related concepts:** [[concepts/consent-record]], [[concepts/gold-vocal]]

## Sources

- `apps/vocal_fix/app.py`
- `docs/GLOSSARY.md`
