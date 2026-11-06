---
type: entity
title: "apps/vocal_fix/app.py (Vocal Fix FastAPI prototype)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal_fix/app.py"
language: py
depends_on:
  - "[[entities/env-vfm-data-dir]]"
used_by:
  - "[[entities/test-python-apps]]"
last_commit_hash: "3997ab2"
tested_by:
  - "[[entities/test-python-apps]]"
tags:
  - entity
  - module
  - vocal-fix
  - python
related:
  - "[[concepts/reference-session]]"
  - "[[entities/mod-vocal-fix-backend]]"
sources:
  - "apps/vocal_fix/app.py"
---

# apps/vocal_fix/app.py (Vocal Fix FastAPI prototype)

## Overview

Local-only FastAPI prototype that accepts and groups five reference recordings; its docstring states it performs no separation, synthesis, cloning or Gold Vocal generation (`apps/vocal_fix/app.py:1-5`).

## Signature / Definition

```py
app = FastAPI(...)
def root_dir() -> Path
def session_path(session_id: str) -> Path
def metadata_or_404(session_id: str) -> dict[str, object]
7 route handlers
```

## Behavior

- Limits: 25 MiB per file, extensions `.wav .mp3 .flac .m4a` (`apps/vocal_fix/app.py:23-24`).
- `root_dir` resolves `VFM_DATA_DIR` (default `data/vocal-fix`, relative to the process cwd) and creates it with mode 0700 (`apps/vocal_fix/app.py:28-31`).
- `session_path` accepts only canonical UUID strings, else 404 (`apps/vocal_fix/app.py:34-41`).
- Endpoints: [[entities/ep-vf-get-root]], [[entities/ep-vf-get-health]], [[entities/ep-vf-get-capabilities]], [[entities/ep-vf-post-references]], [[entities/ep-vf-get-reference]], [[entities/ep-vf-delete-reference]], [[entities/ep-vf-post-process]] (`apps/vocal_fix/app.py:51-162`).

## Connections

- **depends_on:** [[entities/env-vfm-data-dir]]
- **used_by:** [[entities/test-python-apps]]
- **related:** [[concepts/reference-session]], [[entities/mod-vocal-fix-backend]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal_fix/app.py`
