---
type: entity
title: "VFM_DATA_DIR"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal_fix/app.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-vocal-fix-python-app]]"
  - "[[entities/ep-vf-post-references]]"
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related:
  - "[[entities/env-vbm-data-dir]]"
sources:
  - "apps/vocal_fix/app.py"
  - ".env.example"
  - "compose.yaml"
---

# VFM_DATA_DIR

## Overview

Data root of the Python Vocal Fix prototype (`apps/vocal_fix/app.py:28-31`).

## Signature / Definition

```text
VFM_DATA_DIR
```

## Behavior

- Readers: `apps/vocal_fix/app.py:29`; Compose sets `/app/data/vocal-fix` (`compose.yaml:6`).
- Default: `data/vocal-fix` resolved against the process cwd (`apps/vocal_fix/app.py:29`); example `./data/vocal-fix` (`.env.example:7`).
- Validation: none; created with mode 0700 (`apps/vocal_fix/app.py:30`).
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-vocal-fix-python-app]], [[entities/ep-vf-post-references]]
- **related:** [[entities/env-vbm-data-dir]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal_fix/app.py`
- `.env.example`
- `compose.yaml`
