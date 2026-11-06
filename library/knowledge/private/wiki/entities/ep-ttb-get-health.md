---
type: entity
title: "ttb_studio GET /api/health"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb_studio/app.py"
language: py
depends_on:
  - "[[entities/mod-ttb-studio-python-app]]"
used_by: []
last_commit_hash: "3997ab2"
tested_by:
  - "[[entities/test-python-apps]]"
route_method: GET
route_path: "/api/health"
tags:
  - entity
  - function
  - ttb-studio
  - python-endpoint
related:
  - "[[codegraph]]"
sources:
  - "apps/ttb_studio/app.py"
---

# ttb_studio GET /api/health

## Overview

Process health (`apps/ttb_studio/app.py:40-42`).

## Signature / Definition

```py
@app.get("/api/health")
```

## Behavior

- Returns `status: ok`, `app: ttb-studio`, `version: 0.1.0` (`apps/ttb_studio/app.py:42`).

## Connections

- **depends_on:** [[entities/mod-ttb-studio-python-app]]
- **used_by:** no importer or caller found in source
- **related:** [[codegraph]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/ttb_studio/app.py`
