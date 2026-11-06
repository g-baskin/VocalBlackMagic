---
type: entity
title: "tests/test_apps.py (pytest)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "tests/test_apps.py"
language: py
depends_on:
  - "[[entities/mod-vocal-fix-python-app]]"
  - "[[entities/mod-ttb-studio-python-app]]"
used_by: []
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - entity
  - module
  - test
related: []
sources:
  - "tests/test_apps.py"
---

# tests/test_apps.py (pytest)

## Overview

Pytest HTTP contract tests for both FastAPI prototypes using synthetic bytes, no GPU (`tests/test_apps.py:1`).

## Signature / Definition

```py
test suite
```

## Behavior

- Health and root pages (`tests/test_apps.py:15-19`); rights refusal 403 (`tests/test_apps.py:26-31`); five-file rule (`tests/test_apps.py:34-41`); upload, fetch, 501 process, delete (`tests/test_apps.py:44-59`); TTB 503 and 422 (`tests/test_apps.py:62-81`).
- Synthetic `RIFF` bytes mean these tests cannot establish media quality (`tests/test_apps.py:22-23`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-python-app]], [[entities/mod-ttb-studio-python-app]]
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `tests/test_apps.py`
