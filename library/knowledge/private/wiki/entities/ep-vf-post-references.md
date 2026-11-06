---
type: entity
title: "vocal_fix POST /api/references"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal_fix/app.py"
language: py
depends_on:
  - "[[entities/mod-vocal-fix-python-app]]"
  - "[[entities/env-vfm-data-dir]]"
used_by:
  - "[[entities/route-vf-post-references]]"
last_commit_hash: "3997ab2"
tested_by:
  - "[[entities/test-python-apps]]"
route_method: POST
route_path: "/api/references"
tags:
  - entity
  - function
  - vocal-fix
  - python-endpoint
related:
  - "[[concepts/reference-session]]"
  - "[[concepts/consent-record]]"
  - "[[entities/contract-vocal-reference-session]]"
  - "[[codegraph]]"
sources:
  - "apps/vocal_fix/app.py"
---

# vocal_fix POST /api/references

## Overview

Creates a local reference session from five uploads (`apps/vocal_fix/app.py:75-141`).

## Signature / Definition

```py
@app.post("/api/references")
```

## Behavior

- 403 unless `acknowledged_rights` is true (`apps/vocal_fix/app.py:81-84`); 422 unless `voice_owner` is 1 to 120 characters (`apps/vocal_fix/app.py:85-87`) and exactly five files are sent (`apps/vocal_fix/app.py:88-89`).
- Creates a UUID folder with mode 0700 (`apps/vocal_fix/app.py:91-93`); per file: 415 for a bad extension, 422 if empty, 413 over 25 MiB, stored as `source_<n><ext>` never using the uploaded name as a path (`apps/vocal_fix/app.py:96-111`).
- Writes `manifest.json` (mode 0600) with `integrity_verified: False`, `gold_vocal_ready: False`, status `uploaded-awaiting-processing` (`apps/vocal_fix/app.py:112-135`); on any error deletes the folder (`apps/vocal_fix/app.py:136-138`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-python-app]], [[entities/env-vfm-data-dir]]
- **used_by:** [[entities/route-vf-post-references]]
- **related:** [[concepts/reference-session]], [[concepts/consent-record]], [[entities/contract-vocal-reference-session]], [[codegraph]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal_fix/app.py`
