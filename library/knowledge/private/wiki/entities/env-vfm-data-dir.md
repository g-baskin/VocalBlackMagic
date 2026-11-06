---
type: entity
title: "VFM_DATA_DIR"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal_fix/app.py"
language: unknown
depends_on: []
used_by:
  - "[[entities/mod-vocal-fix-python-app]]"
  - "[[entities/ep-vf-post-references]]"
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - entity
  - env-var
  - config
related:
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal_fix/app.py"
---

# VFM_DATA_DIR

## Overview

Directory where the Python Vocal Fix prototype stores reference sessions (`apps/vocal_fix/app.py:29`).

## Signature / Definition

```text
VFM_DATA_DIR
```

## Behavior

- Default `data/vocal-fix` is resolved relative to the process working directory (`apps/vocal_fix/app.py:29`); `.env.example` sets `./data/vocal-fix` (`.env.example:6`).
- Compose sets `/app/data/vocal-fix` on a named volume (`compose.yaml:5-8`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-vocal-fix-python-app]], [[entities/ep-vf-post-references]]
- **related:** [[concepts/reference-session]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal_fix/app.py`
- `.env.example`
- `compose.yaml`
